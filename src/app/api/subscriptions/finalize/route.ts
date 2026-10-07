import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured, getOrCreateProduct } from "@/lib/stripeServer";
import { PLAN_PRICES, CONTACT_PACKS } from "@/lib/pricing";
import { getEffectiveOptionPrices } from "@/lib/db/options";
import { dbAddContactRecharge } from "@/lib/db/contactRecharges";

/**
 * POST /api/subscriptions/finalize
 *
 * À appeler juste après la confirmation réussie du SetupIntent renvoyé par
 * /api/subscriptions/create. Utilise la carte tout juste enregistrée pour
 * créer, de façon totalement indépendante :
 *  - un abonnement dédié à la formule (si demandée),
 *  - un abonnement séparé dédié aux options complémentaires mensuelles
 *    (si demandées),
 *  - un paiement unique pour les frais uniques (ex : pack "Mises en contact").
 *
 * Les options complémentaires ne sont JAMAIS regroupées dans le même
 * abonnement que la formule : ce sont des produits à part, que l'on peut
 * résilier ou modifier indépendamment l'un de l'autre.
 *
 * Body attendu :
 * { customerId: string, paymentMethodId: string, planId?: string, optionIds: string[] }
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "Stripe n'est pas configuré." }, { status: 500 });
  }

  try {
    const { customerId, paymentMethodId, planId, optionIds, contactQuantity, proId } = await req.json();
    const options: string[] = Array.isArray(optionIds) ? optionIds : [];

    // Prix du pack "Mises en contact" réellement choisi — déterminé ici, côté
    // serveur, à partir de la quantité demandée (jamais du montant envoyé par
    // le client). Repli sur le plus petit pack si la quantité est absente ou
    // invalide.
    const contactPack = CONTACT_PACKS.find(p => p.quantity === contactQuantity) || CONTACT_PACKS[0];

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: "customerId ou paymentMethodId manquant." }, { status: 400 });
    }
    if (!planId && options.length === 0) {
      return NextResponse.json({ error: "Aucun élément à créer." }, { status: 400 });
    }
    if (options.includes("contact") && typeof proId !== "string") {
      return NextResponse.json({ error: "proId requis pour créditer les mises en contact." }, { status: 400 });
    }

    // Catalogue effectif des options (base si configurée/alimentée, sinon valeurs par défaut)
    const OPTION_PRICES = await getEffectiveOptionPrices();

    // Attache la carte comme moyen de paiement par défaut du client
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId }).catch(() => {
      // Déjà attachée à ce client — pas bloquant
    });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const result: { planSubscriptionId?: string; optionsSubscriptionId?: string; oneTimePaymentIntentId?: string } = {};

    // ── Abonnement dédié à la formule seule ──
    if (planId && PLAN_PRICES[planId]) {
      const item = PLAN_PRICES[planId];
      const productId = await getOrCreateProduct(item.stripeProductId, item.name);
      const sub = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: { currency: "eur", unit_amount: item.unitAmount, recurring: { interval: "month" }, product: productId },
          quantity: 1,
        }],
        default_payment_method: paymentMethodId,
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: { type: "plan", planId },
      });
      result.planSubscriptionId = sub.id;
    }

    // ── Abonnement dédié aux options complémentaires mensuelles (séparé de la formule) ──
    const monthlyOptionItems = options
      .map(id => OPTION_PRICES[id])
      .filter(opt => opt && opt.cadence === "month");

    if (monthlyOptionItems.length > 0) {
      const items = await Promise.all(monthlyOptionItems.map(async opt => {
        const productId = await getOrCreateProduct(opt.stripeProductId, opt.name);
        return {
          price_data: { currency: "eur", unit_amount: opt.unitAmount, recurring: { interval: "month" as const }, product: productId },
          quantity: 1,
        };
      }));
      const sub = await stripe.subscriptions.create({
        customer: customerId,
        items,
        default_payment_method: paymentMethodId,
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: { type: "options", optionIds: options.join(",") },
      });
      result.optionsSubscriptionId = sub.id;
    }

    // ── Frais uniques (ex : pack "Mises en contact") — paiement immédiat, indépendant ──
    const oneTimeOptions = options
      .map(id => OPTION_PRICES[id])
      .filter(opt => opt && opt.cadence === "once");

    if (oneTimeOptions.length > 0) {
      const amount = oneTimeOptions.reduce(
        (sum, opt) => sum + (opt.id === "contact" ? contactPack.unitAmount : opt.unitAmount),
        0
      );
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "eur",
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          type: "one-time-options",
          optionIds: oneTimeOptions.map(o => o.id).join(","),
          ...(options.includes("contact") ? { contactQuantity: String(contactPack.quantity) } : {}),
        },
      });
      result.oneTimePaymentIntentId = paymentIntent.id;

      // Crédite immédiatement le solde de mises en contact du professionnel
      // — le paiement vient de réussir (confirm: true, ci-dessus).
      if (options.includes("contact")) {
        await dbAddContactRecharge(proId, contactPack.quantity);
      }
    }

    // ── Inclusion automatique de "Gestion prospects/clients" (CRM) avec la formule Gold ──
    // (Fonctionnalité annulée — le CRM n'est plus activé automatiquement)

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[api/subscriptions/finalize] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la finalisation du paiement." }, { status: 500 });
  }
}
