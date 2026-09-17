import { Professional } from "@/types";

/**
 * Ordre d'affichage des fiches professionnelles dans les résultats de
 * recherche et les pages catégories :
 *   0. Formule Gold active
 *   1. Formule Premium active
 *   2. Formule Standard avec email et téléphone renseignés
 *   3. Fiches sans coordonnées (email ou téléphone manquant) — toujours en dernier,
 *      quelle que soit la formule.
 */
export function getListingRank(p: Professional): number {
  const hasContact = Boolean((p.email ?? "").trim()) && Boolean((p.phone ?? "").trim());
  if (!hasContact) return 3;
  if (p.plan === "gold") return 0;
  if (p.plan === "premium") return 1;
  return 2; // standard avec coordonnées complètes
}

/** Trie une liste de professionnels selon l'ordre d'affichage standard du site. */
export function sortByListingRank(pros: Professional[]): Professional[] {
  return [...pros].sort((a, b) => getListingRank(a) - getListingRank(b));
}

/**
 * Ordre d'affichage spécifique à la page de résultats PROLOCAL AI
 * (/besoin) :
 *   0. Formule Gold active
 *   1. Formule Premium active
 *   2. Formule Standard avec email ET téléphone
 *   3. Formule Standard avec téléphone (sans email)
 *   4. Formule Standard avec email (sans téléphone)
 *   5. Formule Standard sans coordonnées
 * Contrairement à getListingRank, une formule Gold/Premium reste toujours
 * prioritaire même si ses coordonnées sont incomplètes.
 */
export function getNeedResultsRank(p: Professional): number {
  if (p.plan === "gold") return 0;
  if (p.plan === "premium") return 1;
  const hasEmail = Boolean((p.email ?? "").trim());
  const hasPhone = Boolean((p.phone ?? "").trim());
  if (hasEmail && hasPhone) return 2;
  if (hasPhone) return 3;
  if (hasEmail) return 4;
  return 5;
}
