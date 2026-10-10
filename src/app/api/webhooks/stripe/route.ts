import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripeServer";
import { dbGetProfessionalByStripeCustomerId } from "@/lib/db/professionals";
import { notifyAdmin } from "@/lib/notifyAdmin";

/**
 * POST /api/webhooks/stripe
 *
 * Reçoit les événements Stripe pour notifier l'équipe des RENOUVELLEMENTS
 * AUTOMATIQUES mensuels des abonnements (formule, options complémentaires) —
 * ces paiements se produisent côté Stripe, en dehors de tout appel à
 * /api/subscriptions/finalize (qui ne couvre que le premier paiement, déclenché
 * par une action du professionnel sur le site), donc invisibles sans webhook.
 *
 * N'écoute que "invoice.paid", et ignore volontairement les factures dont
 * billing_reason est "subscription_create" : celles-ci correspondent au
 * tout premier paiement d'un abonnement, déjà notifié par
 * /api/subscriptions/finalize — les re-notifier ferait doublon.
 *
 * ⚠️ Configuration requise (tant que ce qui suit n'est pas fait, cette route
 * répond 200 mais ne fait rien d'utile) :
 * 1. Dashboard Stripe → Développeurs → Webhooks → Ajouter un endpoint
 *    → URL : https://www.prolocal-landes.fr/api/webhooks/stripe
 *    → Événement à écouter : invoice.paid
 * 2. Copier le "Signing secret" affiché (commence par whsec_...) dans la
 *    variable d'environnement STRIPE_WEBHOOK_SECRET (Vercel + .env.local).
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "Stripe n'est pas configuré." }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Pas encore configuré (voir note ci-dessus) : on répond 200 pour que
    // Stripe ne retente pas indéfiniment, mais rien n'est traité.
    console.warn("[api/webhooks/stripe] STRIPE_WEBHOOK_SECRET n'est pas définie — événement ignoré.");
    return NextResponse.json({ received: true, configured: false });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("En-tête stripe-signature manquant.");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("[api/webhooks/stripe] Signature invalide:", err.message);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;

    // "subscription_create" = tout premier paiement d'un abonnement, déjà
    // notifié par /api/subscriptions/finalize — on ne traite ici que les
    // renouvellements ("subscription_cycle") pour ne jamais notifier deux
    // fois le même paiement.
    if (invoice.billing_reason === "subscription_cycle") {
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      const pro = customerId ? await dbGetProfessionalByStripeCustomerId(customerId).catch(() => null) : null;
      const displayName = pro?.companyName || `client Stripe ${customerId || "inconnu"}`;

      const lineItems = invoice.lines.data
        .map(line => `${line.description || "Abonnement"} (${(line.amount / 100).toFixed(2)} €)`)
        .join("\n");

      await notifyAdmin(
        `Renouvellement automatique — ${displayName}`,
        `Un renouvellement d'abonnement vient d'être payé automatiquement sur Prolocal-Landes.

Professionnel : ${displayName}
Montant total : ${(invoice.amount_paid / 100).toFixed(2)} €
${lineItems}`
      );
    }
  }

  return NextResponse.json({ received: true });
}
