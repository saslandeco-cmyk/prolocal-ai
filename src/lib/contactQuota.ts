import type { PlanType } from "@/types";

/**
 * Base gratuite de mises en contact offerte une seule fois à l'inscription,
 * selon la formule du professionnel — ce n'est plus un quota mensuel
 * rechargé automatiquement chaque mois. Au-delà, le professionnel doit
 * acheter des packs via l'option complémentaire "Mises en contact"
 * (src/lib/pricing.ts : CONTACT_PACKS) pour augmenter son solde
 * (src/lib/db/contactRecharges.ts).
 *
 * Le solde total d'un professionnel = cette base + la somme de ses
 * recharges. Il est consommé au fil de l'eau par les demandes reçues (tous
 * canaux confondus, sur tout l'historique — plus de remise à zéro
 * mensuelle) : au-delà, les demandes les plus récentes restent visibles
 * (date, canal) mais masquées (voir DemandesTab.tsx).
 *
 * Ce même solde désactive aussi, côté fiche publique, les boutons "Poser
 * une question"/"Appeler"/"Envoyer un email" une fois atteint (voir
 * ProfessionalProfileView.tsx) — le WhatsApp n'est volontairement pas
 * concerné.
 */
export const CONTACT_FREE_BASE: Record<PlanType, number> = {
  standard: 1,
  premium: 3,
  gold: 10,
};

export interface ContactQuota {
  /** Solde total (base gratuite de la formule + recharges achetées). */
  limit: number;
  /** Nombre de demandes reçues (tous canaux, tout l'historique). */
  used: number;
  /** Solde restant, jamais négatif. */
  remaining: number;
  plan: PlanType | null;
}

export function computeContactLimit(plan: PlanType, totalRecharged: number): number {
  return CONTACT_FREE_BASE[plan] + totalRecharged;
}

interface DatedId {
  id: string;
  createdAt: string;
}

/**
 * Détermine les demandes masquées : les `limit` premières (les plus
 * anciennes) restent lisibles, les suivantes (les plus récentes) sont
 * verrouillées jusqu'à une recharge.
 */
export function getLockedDemandeIds<T extends DatedId>(demandes: T[], limit: number): Set<string> {
  const sorted = [...demandes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return new Set(sorted.slice(limit).map(d => d.id));
}

/** Regroupe des demandes masquées par date (jour), du plus récent au plus ancien. */
export function groupLockedByDate<T extends DatedId>(locked: T[]): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of locked) {
    const day = d.createdAt.slice(0, 10);
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
