/**
 * Bannières par défaut par catégorie.
 * Chemin relatif depuis /public — ajouter une entrée par catégorie au fur et à mesure.
 */
export const DEFAULT_BANNERS: Record<string, string> = {
  "Alimentation & Épicerie":      "/banners/alimentation.jpg",
  "Artisanat & Métiers d'art":    "/banners/artisanat.webp",
  "Bâtiment & Travaux":           "/banners/batiment.webp",
  "Beauté & Bien-être":           "/banners/beaute-bien-etre.webp",
  "Commerce & Vente":             "/banners/commerce.jpg",
  "Culture & Élevage":            "/banners/culture-et-elevage.webp",
  "Immobilier":                   "/banners/immobilier.webp",
  "Informatique & Numérique":     "/banners/informatique-et-numerique.webp",
  "Restauration":                 "/banners/restauration.webp",
  "Services à la personne":       "/banners/service-a-la-personne.webp",
  "Sport & Fitness":              "/banners/sport.webp",
  "Transport de personnes":       "/banners/transport.webp",
};

/**
 * Bannières par défaut par sous-catégorie — prioritaires sur la bannière de
 * la catégorie parente quand elles existent (ajouter une entrée au fur et à
 * mesure). Clé = libellé exact de la sous-catégorie.
 */
export const DEFAULT_SUBCATEGORY_BANNERS: Record<string, string> = {
  "Alimentation générale":     "/banners/alimentation-generale.webp",
  "Boucherie / Charcuterie":   "/banners/boucherie-charcuterie.webp",
  "Boulangerie / Pâtisserie":  "/banners/boulangerie-patisserie.webp",
  "Caviste / Marchand de boissons": "/banners/cavites.webp",
  "Primeurs":                  "/banners/primeur.webp",
  "Poissonnerie":               "/banners/poissonerie.webp",
  "Épicerie fine":              "/banners/epicerie-fine.webp",
  "Fromagerie / Crèmerie":      "/banners/fromagerie.webp",
  "Coiffeur":                   "/banners/coiffure.jpg",
  "Toilettage":                 "/banners/Toilettage.jpg",
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
