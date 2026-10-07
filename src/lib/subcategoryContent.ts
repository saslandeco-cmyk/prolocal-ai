/**
 * Contenu éditorial généré pour les pages sous-catégorie
 * (/categories/[categorie]/[sous-categorie]) — transforme une simple liste
 * filtrée en véritable page d'atterrissage locale (intro, "À propos", CTA,
 * FAQ), sans dépendre d'un contenu saisi à la main pour chacune des
 * dizaines de combinaisons catégorie/sous-catégorie existantes.
 *
 * Généré à partir des mêmes données (libellés + professionnels déjà
 * récupérés) côté serveur (JSON-LD, app/categories/[category]/[subcategory]/page.tsx)
 * et côté client (affichage, components/category/SubcategoryPage.tsx), pour
 * que le contenu visible corresponde toujours exactement aux données
 * structurées (recommandation Google pour les extraits FAQ).
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface SubcategoryLandingContent {
  /** Paragraphe affiché juste au-dessus de la grille de résultats — null si aucun professionnel référencé. */
  intro: string | null;
  seoTitle: string;
  seoText: string[];
  ctaText: string;
}

/** Formate une liste en énumération française naturelle, tronquée au-delà de `max` éléments. */
function joinFrenchList(items: string[], max = 6): string {
  const shown = items.slice(0, max);
  const joined = shown.length <= 1 ? (shown[0] || "") : `${shown.slice(0, -1).join(", ")} et ${shown[shown.length - 1]}`;
  return items.length > max ? `${joined} et dans d'autres communes du département` : joined;
}

export function buildSubcategoryLandingContent(params: {
  categoryLabel: string;
  subcategoryLabel: string;
  proCount: number;
  cities: string[];
}): SubcategoryLandingContent {
  const { categoryLabel, subcategoryLabel, proCount, cities } = params;

  const intro = proCount > 0
    ? `Prolocal-Landes référence ${proCount} professionnel${proCount > 1 ? "s" : ""} en ${subcategoryLabel} dans le département des Landes${cities.length > 0 ? `, notamment à ${joinFrenchList(cities)}` : ""}. Consultez leurs fiches pour comparer leurs coordonnées, leurs avis clients et leur zone d'intervention avant de les contacter directement.`
    : null;

  const seoText = [
    `Le secteur « ${subcategoryLabel} » regroupe les entreprises et artisans spécialisés dans ce domaine au sein de la catégorie ${categoryLabel}. Sur Prolocal-Landes, chaque fiche professionnelle est vérifiée avant publication : coordonnées, horaires d'ouverture, zone d'intervention et avis clients sont centralisés au même endroit pour faciliter votre recherche.`,
    cities.length > 0
      ? `Nos professionnels en ${subcategoryLabel} sont présents notamment à ${joinFrenchList(cities)}. Grâce à la carte interactive et au moteur de recherche ci-dessus, filtrez les résultats par ville, par rayon de distance ou par mot-clé pour trouver rapidement l'interlocuteur le plus proche de chez vous.`
      : `Aucun professionnel en ${subcategoryLabel} n'est pour l'instant référencé dans les Landes — soyez parmi les premiers à y apparaître en référençant gratuitement votre entreprise.`,
    `Contactez directement un professionnel par téléphone, WhatsApp ou email depuis sa fiche, ou utilisez PROLOCAL AI pour décrire votre besoin en quelques mots et être mis en relation avec les professionnels les plus pertinents.`,
  ];

  const ctaText = `Vous exercez en ${subcategoryLabel} dans les Landes ? Référencez gratuitement votre entreprise sur Prolocal-Landes pour gagner en visibilité auprès des habitants du département et recevoir vos premières demandes de contact.`;

  return {
    intro,
    seoTitle: `Trouver un professionnel en ${subcategoryLabel} dans les Landes`,
    seoText,
    ctaText,
  };
}

export function buildSubcategoryFaq(params: {
  subcategoryLabel: string;
  proCount: number;
  cityCount: number;
}): FaqItem[] {
  const { subcategoryLabel, proCount, cityCount } = params;
  return [
    {
      q: `Combien y a-t-il de professionnels en ${subcategoryLabel} référencés dans les Landes ?`,
      a: `${proCount} professionnel${proCount > 1 ? "s" : ""} en ${subcategoryLabel} ${proCount > 1 ? "sont" : "est"} actuellement référencé${proCount > 1 ? "s" : ""} sur Prolocal-Landes${cityCount > 0 ? `, dans ${cityCount} commune${cityCount > 1 ? "s" : ""} du département` : ""}.`,
    },
    {
      q: `Comment choisir un bon professionnel en ${subcategoryLabel} ?`,
      a: `Comparez les fiches détaillées, les avis vérifiés laissés par d'autres clients, et contactez directement le professionnel par téléphone, email ou WhatsApp depuis sa fiche sur Prolocal-Landes.`,
    },
    {
      q: `Comment référencer mon entreprise en ${subcategoryLabel} ?`,
      a: `L'inscription est gratuite et rapide : rendez-vous sur la page d'inscription, renseignez votre numéro SIREN et les informations de votre entreprise. Votre fiche est visible immédiatement sur Prolocal-Landes.`,
    },
  ];
}
