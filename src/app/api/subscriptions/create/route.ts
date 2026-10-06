import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripeServer";
import { PLAN_PRICES, CONTACT_PACKS } from "@/lib/pricing";
import { getEffectiveOptionPrices } from "@/lib/db/options";

/**
 * POST /api/subscriptions/create
 *
 * Prépare le paiement : crée (ou réutilise) un client Stripe, vérifie
 * qu'aucune formule/option demandée n'est déjà active pour ce SIREN, puis
 * crée un SetupIntent permettant d'enregistrer une carte bancaire via
 * Stripe Elements (aucun abonnement n'est créé à ce stade).
 *
 * Important : les options complémentaires sont des produits à part entière,
 * totalement indépendants des formules. La carte enregistrée ici sert
 * ensuite à créer, séparément, un abonnement pour la formule ET un autre
 * abonnement pour les options (voir /api/subscriptions/finalize) — jamais
 * un seul et même abonnement mélangeant formule et options.
 *
 * Body attendu :
 * {
 *   planId?: "premium" | "gold",
 *   optionIds: string[],
 *   email: string,
 *   companyName: string,
 *   siren?: string,
 *   billing?: { legalForm?, siren?, vatNumber?, address?, postalCode?, city? },
 * }
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json(
      { error: "Stripe n'est pas configuré. Ajoutez STRIPE_SECRET_KEY dans votre fichier .env.local." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const planId: string | undefined = body.planId;
    const optionIds: string[] = Array.isArray(body.optionIds) ? body.optionIds : [];
    const email: string | undefined = body.email;
    const contactQuantity: number | undefined = body.contactQuantity;

    if (optionIds.includes("contact") && contactQuantity !== undefined && !CONTACT_PACKS.some(p => p.quantity === contactQuantity)) {
      return NextResponse.json({ error: "Pack de mises en contact invalide." }, { status: 400 });
    }
    const OPTION_PRICES = await getEffectiveOptionPrices();
    const companyName: string = body.companyName || "Inscription Prolocal-Landes";
    const billing: {
      legalForm?: string; siren?: string; vatNumber?: string;
      address?: string; postalCode?: string; city?: string;
    } = body.billing || {};
    const siren: string = (billing.siren || body.siren || "").replace(/\s/g, "");

    if (!planId && optionIds.length === 0) {
      return NextResponse.json({ error: "Aucun élément à facturer." }, { status: 400 });
    }

    // ── Blocage : une formule ou une option déjà active pour ce SIREN ne peut
    // pas être recommandée (quantité limitée à 1 par SIREN, tous clients Stripe
    // confondus pour cette entreprise).
    if (siren) {
      try {
        const matchingCustomers = await stripe.customers.search({
          query: `metadata['siren']:'${siren}'`,
          limit: 100,
        });

        const activeProductIds = new Set<string>();
        for (const cust of matchingCustomers.data) {
          const subs = await stripe.subscriptions.list({ customer: cust.id, status: "active", limit: 100 });
          for (const sub of subs.data) {
            for (const li of sub.items.data) {
              const productRef = li.price.product;
              if (typeof productRef === "string") activeProductIds.add(productRef);
            }
          }
        }

        const alreadyActiveLabels: string[] = [];
        if (planId && PLAN_PRICES[planId] && activeProductIds.has(PLAN_PRICES[planId].stripeProductId)) {
          alreadyActiveLabels.push(PLAN_PRICES[planId].name);
        }
        for (const id of optionIds) {
          const opt = OPTION_PRICES[id];
          if (opt && activeProductIds.has(opt.stripeProductId)) {
            alreadyActiveLabels.push(opt.name);
          }
        }

        if (alreadyActiveLabels.length > 0) {
          return NextResponse.json(
            { error: `Déjà actif pour ce SIREN (limité à 1 exemplaire) : ${alreadyActiveLabels.join(", ")}.` },
            { status: 409 }
          );
        }
      } catch (searchErr) {
        console.warn("[api/subscriptions/create] Vérification SIREN impossible:", searchErr);
      }
    }

    // ── Client Stripe : réutilise un client existant par email, sinon en crée un ──
    const customerPayload = {
      name: companyName,
      address: (billing.address || billing.postalCode || billing.city) ? {
        line1: billing.address || undefined,
        postal_code: billing.postalCode || undefined,
        city: billing.city || undefined,
        country: "FR",
      } : undefined,
      metadata: {
        siren: siren || "",
        legalForm: billing.legalForm || "",
      },
    };

    let customerId: string;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
        await stripe.customers.update(customerId, customerPayload);
      } else {
        customerId = (await stripe.customers.create({ email, ...customerPayload })).id;
      }
    } else {
      customerId = (await stripe.customers.create(customerPayload)).id;
    }

    // Numéro de TVA intracommunautaire (facultatif)
    if (billing.vatNumber && billing.vatNumber.trim()) {
      try {
        await stripe.customers.createTaxId(customerId, { type: "eu_vat", value: billing.vatNumber.trim() });
      } catch {
        // Un numéro de TVA déjà enregistré ou invalide ne doit pas bloquer le paiement
      }
    }

    // ── SetupIntent : enregistre la carte, sans créer d'abonnement pour l'instant.
    // La création réelle (et dissociée) des abonnements se fait dans /finalize,
    // une fois la carte confirmée côté client.
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      usage: "off_session",
      metadata: {
        companyName, planId: planId || "", optionIds: optionIds.join(","),
        ...(optionIds.includes("contact") && contactQuantity ? { contactQuantity: String(contactQuantity) } : {}),
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
      mode: "setup",
    });
  } catch (err: any) {
    console.error("[api/subscriptions/create] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la préparation du paiement." }, { status: 500 });
  }
}
