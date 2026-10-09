import { Professional } from "@/types";

/**
 * Ordre d'affichage des fiches professionnelles — unique sur l'ensemble du
 * site (résultats de recherche, pages catégories/sous-catégories/villes,
 * PROLOCAL AI) :
 *   0. Formule Gold active — toujours en tête, quelles que soient ses coordonnées.
 *   1. Email ET téléphone renseignés (Premium et Standard confondus).
 *   2. Email renseigné seul (sans téléphone).
 *   3. Téléphone renseigné seul (sans email).
 *   4. Ni email ni téléphone renseigné — toujours en dernier.
 * Premium n'est plus un palier à part : au-delà de Gold, le classement ne
 * dépend que des coordonnées réellement renseignées.
 */
export function getListingRank(p: Professional): number {
  if (p.plan === "gold") return 0;
  const hasEmail = Boolean((p.email ?? "").trim());
  const hasPhone = Boolean((p.phone ?? "").trim());
  if (hasEmail && hasPhone) return 1;
  if (hasEmail) return 2;
  if (hasPhone) return 3;
  return 4;
}

/** Trie une liste de professionnels selon l'ordre d'affichage standard du site. */
export function sortByListingRank(pros: Professional[]): Professional[] {
  return [...pros].sort((a, b) => getListingRank(a) - getListingRank(b));
}

/**
 * Alias de getListingRank — la page de résultats PROLOCAL AI (/besoin) suit
 * désormais le même ordre d'affichage unique que le reste du site (voir
 * getListingRank ci-dessus). Conservé comme fonction distincte pour ne pas
 * avoir à modifier ses appelants.
 */
export function getNeedResultsRank(p: Professional): number {
  return getListingRank(p);
}
