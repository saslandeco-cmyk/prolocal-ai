/**
 * Bannières par défaut par catégorie.
 * Chemin relatif depuis /public — ajouter une entrée par catégorie au fur et à mesure.
 */
export const DEFAULT_BANNERS: Record<string, string> = {
  "Alimentation & Épicerie":      "/banners/alimentation.jpg",
  "Artisanat & Métiers d'art":    "/banners/artisanat.png",
  "Bâtiment & Travaux":           "/banners/batiment.png",
  "Beauté & Bien-être":           "/banners/beaute-bien-etre.png",
  "Commerce & Vente":             "/banners/commerce.jpg",
  "Culture & Élevage":            "/banners/culture-et-elevage.png",
  "Immobilier":                   "/banners/immobilier.jpg",
  "Informatique & Numérique":     "/banners/informatique.jpg",
  "Restauration":                 "/banners/restauration.jpg",
  "Services à la personne":       "/banners/services.jpg",
  "Sport & Fitness":              "/banners/sport.png",
  "Transport de personnes":       "/banners/transport.png",
};

/**
 * Bannières par défaut par sous-catégorie — prioritaires sur la bannière de
 * la catégorie parente quand elles existent (ajouter une entrée au fur et à
 * mesure). Clé = libellé exact de la sous-catégorie.
 */
export const DEFAULT_SUBCATEGORY_BANNERS: Record<string, string> = {
  "Alimentation générale":     "/banners/alimentation-generale.png",
  "Boucherie / Charcuterie":   "/banners/boucherie-charcuterie.png",
  "Boulangerie / Pâtisserie":  "/banners/boulangerie-patisserie.png",
};

/**
 * Retourne la bannière d'un professionnel :
 * - sa propre bannière si elle existe
 * - sinon la bannière par défaut de sa sous-catégorie
 * - sinon la bannière par défaut de sa catégorie
 * - sinon null (le composant affiche le dégradé vert)
 */
export function getBanner(banner: string | undefined, category: string, subcategory?: string): string | null {
  if (banner) return banner;
  if (subcategory && DEFAULT_SUBCATEGORY_BANNERS[subcategory]) return DEFAULT_SUBCATEGORY_BANNERS[subcategory];
  return DEFAULT_BANNERS[category] ?? null;
}
