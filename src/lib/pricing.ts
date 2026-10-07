/**
 * Tarification utilisée pour construire les sessions Stripe Checkout.
 * Centralisé côté serveur pour ne jamais faire confiance aux montants
 * envoyés par le client (sécurité : le prix facturé doit toujours être
 * déterminé côté serveur, jamais par le navigateur).
 */

export type Cadence = "month";

export interface CheckoutItem {
  id: string;
  name: string;
  /** Montant en centimes d'euro */
  unitAmount: number;
  cadence: Cadence | "once";
  /** Texte descriptif affiché aux professionnels (dashboard, inscription) */
  description?: string;
  /**
   * ID de produit Stripe fixe et déterministe. L'API Stripe Subscriptions
   * (items[] et add_invoice_items[]) n'accepte pas la création de produit
   * à la volée (product_data) comme le fait Checkout Session — elle exige
   * un `product` déjà existant. On utilise donc un ID fixe par article du
   * catalogue, créé automatiquement au premier usage puis réutilisé.
   */
  stripeProductId: string;
}

// Formules (abonnement mensuel)
export const PLAN_PRICES: Record<string, CheckoutItem> = {
  premium: { id: "premium", name: "Formule Premium", unitAmount: 900,  cadence: "month", stripeProductId: "prolocal_plan_premium" },
  gold:    { id: "gold",    name: "Formule Gold",     unitAmount: 2900, cadence: "month", stripeProductId: "prolocal_plan_gold" },
};

/**
 * Packs de l'option "Mises en contact" — tarif dégressif selon la quantité.
 * Le premier pack sert de prix "à partir de" affiché dans le catalogue
 * (OPTION_PRICES.contact ci-dessous) ; le pack réellement commandé est
 * choisi par le professionnel puis validé côté serveur (jamais confiance
 * au montant envoyé par le client).
 */
export interface ContactPack {
  quantity: number;
  /** Montant en centimes d'euro */
  unitAmount: number;
}
export const CONTACT_PACKS: ContactPack[] = [
  { quantity: 5, unitAmount: 1000 },
  { quantity: 10, unitAmount: 1800 },
  { quantity: 20, unitAmount: 3000 },
  { quantity: 50, unitAmount: 6000 },
];

// Options complémentaires — catalogue par défaut / de secours (voir
// src/lib/db/options.ts : un catalogue géré depuis l'admin peut le remplacer).
export const OPTION_PRICES: Record<string, CheckoutItem> = {
  contact: {
    id: "contact", name: "Mises en contact", unitAmount: CONTACT_PACKS[0].unitAmount, cadence: "once",
    description: "Rechargez vos crédits de mises en contact à tout moment — prix dégressifs selon la quantité achetée.",
    stripeProductId: "prolocal_opt_contact",
  },
  pub: {
    id: "pub", name: "Encart publicitaire ciblé", unitAmount: 2500, cadence: "month",
    description: "Affichez une bannière publicitaire de votre fiche sur la page de votre catégorie.",
    stripeProductId: "prolocal_opt_pub",
  },
  crm: {
    id: "crm", name: "Gestion prospects/clients", unitAmount: 900, cadence: "month",
    description: "Éditeur de devis et facturation électronique, avec gestion de vos prospects et clients.",
    stripeProductId: "prolocal_opt_crm",
  },
};
