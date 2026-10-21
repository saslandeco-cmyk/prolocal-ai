import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripeServer";

/**
 * POST /api/subscriptions/update-payment-method
 *
 * Crée un SetupIntent pour permettre au professionnel d'enregistrer une
 * nouvelle carte bancaire (affichée via Stripe Elements en mode "setup"),
 * sans quitter le tableau de bord.
 *
 * Body attendu : { customerId: string }
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "Stripe n'est pas configuré." }, { status: 500 });
  }

  try {
    const { customerId } = await req.json();
    if (!customerId) {
      return NextResponse.json({ error: "customerId manquant." }, { status: 400 });
    }

    // `allow_redirects: "never"` exclut les moyens de paiement à redirection
    // (PayPal, iDEAL...) du formulaire proposé au client — voir la même
    // remarque dans /api/subscriptions/create.
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err: any) {
    console.error("[api/subscriptions/update-payment-method] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la préparation du changement de carte." }, { status: 500 });
  }
}
