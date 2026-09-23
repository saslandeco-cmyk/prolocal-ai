import type { PlanType } from "@/types";

/**
 * Nombre de demandes (tous canaux confondus) qu'un professionnel peut lire
 * chaque mois calendaire dans son tableau de bord — au-delà, les demandes
 * les plus récentes du mois restent visibles (date, canal) mais masquées
 * (voir DemandesTab.tsx). `null` = illimité.
 */
export const CONTACT_QUOTAS: Record<PlanType, number | null> = {
  standard: 3,
  premium: 15,
  gold: null,
};
