"use client";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Client Stripe côté navigateur. Nécessite NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * (clé publique Stripe — pk_test_... en mode test, pk_live_... en mode réel,
 * disponible dans le Dashboard Stripe → Développeurs → Clés API).
 */
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * true tant que la clé publique configurée est une clé de test (pk_test_...).
 * Permet de n'afficher le badge "MODE TEST" et les indications de carte
 * factice (voir inscription/page.tsx) que lorsque c'est réellement le cas —
 * jamais à un vrai client une fois la bascule faite vers des clés pk_live_.
 */
export const isStripeTestMode = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").startsWith("pk_test_");

export function getStripeClient(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn("[stripeClient] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n'est pas définie.");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
