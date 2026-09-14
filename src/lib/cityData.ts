import { slugify } from "./profileUrl";

export interface CityMeta {
  name: string;         // libellé exact (correspond à Professional.city)
  slug: string;
  postalCode: string;
  seoTitle: string;
  intro: string[];      // paragraphes d'introduction (HTML autorisé)
  neighbors: string[];  // slugs de communes géographiquement proches
  lat: number;          // coordonnées du centre-ville — SEO local (schema.org Place/geo)
  lng: number;
}

/**
 * Contenu unique par ville, dans le même esprit que categoryData.ts pour
 * les catégories — un texte SEO propre à chaque commune, jamais dupliqué,
 * pour que chaque page /annuaire/[ville] ait une vraie valeur ajoutée
 * indexable par Google (et pas seulement une liste de fiches).
 *
 * "Autre commune des Landes" (valeur fourre-tout du sélecteur d'inscription)
 * est volontairement exclue : elle ne représente pas une vraie commune et
 * n'aurait aucun contenu local à proposer.
 */
export const CITY_META: Record<string, CityMeta> = {
  "mont-de-marsan": {
    name: "Mont-de-Marsan", slug: "mont-de-marsan", postalCode: "40000",
    seoTitle: "Professionnels et commerçants à Mont-de-Marsan",
    intro: [
      "Préfecture du département, Mont-de-Marsan est le cœur administratif et économique des Landes. Bâtie au confluent du Midou et de la Douze, la ville concentre un tissu de commerces, d'artisans et de prestataires de services particulièrement dense pour sa taille.",
    ],
    neighbors: ["tartas", "hagetmau", "grenade-sur-ladour"],
    lat: 43.8914, lng: -0.5006,
  },
  "dax": {
    name: "Dax", slug: "dax", postalCode: "40100",
    seoTitle: "Professionnels et commerçants à Dax",
    intro: [
      "Ville thermale réputée depuis l'Antiquité pour ses eaux et sa boue thermale, Dax attire chaque année curistes et visiteurs — un dynamisme qui se reflète dans la diversité de ses commerces, artisans et professionnels de santé.",
    ],
    neighbors: ["peyrehorade", "saint-vincent-de-tyrosse", "soustons", "tartas"],
    lat: 43.7101, lng: -1.0527,
  },
  "biscarrosse": {
    name: "Biscarrosse", slug: "biscarrosse", postalCode: "40600",
    seoTitle: "Professionnels et commerçants à Biscarrosse",
    intro: [
      "Entre océan Atlantique et lac, Biscarrosse est l'une des communes les plus dynamiques du littoral landais, portée par un tourisme actif toute l'année et une population résidente en forte croissance.",
    ],
    neighbors: ["parentis-en-born", "mimizan", "sabres"],
    lat: 44.3952, lng: -1.1637,
  },
  "mimizan": {
    name: "Mimizan", slug: "mimizan", postalCode: "40200",
    seoTitle: "Professionnels et commerçants à Mimizan",
    intro: [
      "Partagée entre Mimizan-Bourg et Mimizan-Plage, la commune conjugue vie locale toute l'année et forte activité saisonnière liée au tourisme balnéaire et à son vaste plan d'eau.",
    ],
    neighbors: ["biscarrosse", "parentis-en-born", "lit-et-mixe"],
    lat: 44.2079, lng: -1.2258,
  },
  "parentis-en-born": {
    name: "Parentis-en-Born", slug: "parentis-en-born", postalCode: "40160",
    seoTitle: "Professionnels et commerçants à Parentis-en-Born",
    intro: [
      "Située au bord de l'étang de Biscarrosse-Parentis, au cœur du pays de Born, Parentis-en-Born est un bourg dynamique qui a su conserver un commerce de proximité vivant malgré la proximité des grands pôles côtiers.",
    ],
    neighbors: ["biscarrosse", "mimizan", "sabres"],
    lat: 44.3583, lng: -1.0764,
  },
  "morcenx": {
    name: "Morcenx", slug: "morcenx", postalCode: "40110",
    seoTitle: "Professionnels et commerçants à Morcenx",
    intro: [
      "Carrefour ferroviaire et routier historique au cœur de la forêt landaise, Morcenx joue un rôle de pôle de services pour les communes environnantes du centre du département.",
    ],
    neighbors: ["labouheyre", "mimizan", "tartas"],
    lat: 44.0367, lng: -0.9128,
  },
  "labouheyre": {
    name: "Labouheyre", slug: "labouheyre", postalCode: "40210",
    seoTitle: "Professionnels et commerçants à Labouheyre",
    intro: [
      "Ancienne halte ferroviaire au milieu du massif forestier landais, Labouheyre conserve un commerce de centre-bourg actif, porté par une activité liée à la filière bois et à l'agriculture locale.",
    ],
    neighbors: ["morcenx", "sabres", "mimizan"],
    lat: 44.2183, lng: -0.9147,
  },
  "castets": {
    name: "Castets", slug: "castets", postalCode: "40260",
    seoTitle: "Professionnels et commerçants à Castets",
    intro: [
      "Bourg-centre du canton, Castets bénéficie d'une position stratégique entre l'autoroute A63 et le littoral, ce qui en fait un point de passage et de service pour tout le secteur du Marensin.",
    ],
    neighbors: ["soustons", "lit-et-mixe", "dax"],
    lat: 43.8814, lng: -1.14,
  },
  "saint-vincent-de-tyrosse": {
    name: "Saint-Vincent-de-Tyrosse", slug: "saint-vincent-de-tyrosse", postalCode: "40230",
    seoTitle: "Professionnels et commerçants à Saint-Vincent-de-Tyrosse",
    intro: [
      "Porte d'entrée du pays maremnais entre Dax et la côte, Saint-Vincent-de-Tyrosse connaît une croissance démographique soutenue qui dynamise son tissu commercial et artisanal.",
    ],
    neighbors: ["dax", "soustons", "capbreton"],
    lat: 43.6714, lng: -1.3006,
  },
  "peyrehorade": {
    name: "Peyrehorade", slug: "peyrehorade", postalCode: "40300",
    seoTitle: "Professionnels et commerçants à Peyrehorade",
    intro: [
      "Située au confluent des Gaves réunis et de l'Adour, Peyrehorade est un pôle de services pour le sud du département, à la croisée des Landes et du Pays basque.",
    ],
    neighbors: ["dax", "hagetmau", "aire-sur-ladour"],
    lat: 43.5439, lng: -1.1247,
  },
  "hagetmau": {
    name: "Hagetmau", slug: "hagetmau", postalCode: "40700",
    seoTitle: "Professionnels et commerçants à Hagetmau",
    intro: [
      "Capitale du chapeau et du siège en Chalosse, Hagetmau conserve une tradition artisanale et industrielle forte, associée à un commerce de centre-ville actif.",
    ],
    neighbors: ["aire-sur-ladour", "grenade-sur-ladour", "mont-de-marsan"],
    lat: 43.6539, lng: -0.5989,
  },
  "aire-sur-ladour": {
    name: "Aire-sur-l'Adour", slug: "aire-sur-ladour", postalCode: "40800",
    seoTitle: "Professionnels et commerçants à Aire-sur-l'Adour",
    intro: [
      "Ancienne cité épiscopale au bord de l'Adour, Aire-sur-l'Adour est un pôle de services reconnu à l'est du département, réputé notamment pour son marché et ses productions locales (foie gras, volailles).",
    ],
    neighbors: ["hagetmau", "grenade-sur-ladour", "peyrehorade"],
    lat: 43.7011, lng: -0.2606,
  },
  "grenade-sur-ladour": {
    name: "Grenade-sur-l'Adour", slug: "grenade-sur-ladour", postalCode: "40270",
    seoTitle: "Professionnels et commerçants à Grenade-sur-l'Adour",
    intro: [
      "Bastide médiévale au bord de l'Adour, Grenade-sur-l'Adour combine patrimoine historique et vie économique locale active, avec un marché et des commerces de proximité appréciés.",
    ],
    neighbors: ["aire-sur-ladour", "mont-de-marsan", "hagetmau"],
    lat: 43.7756, lng: -0.4372,
  },
  "tartas": {
    name: "Tartas", slug: "tartas", postalCode: "40400",
    seoTitle: "Professionnels et commerçants à Tartas",
    intro: [
      "Sous-préfecture historique au bord de la Midouze, Tartas est un pôle de services important pour le centre du département, entre Mont-de-Marsan et Dax.",
    ],
    neighbors: ["mont-de-marsan", "dax", "morcenx"],
    lat: 43.8378, lng: -0.8064,
  },
  "soustons": {
    name: "Soustons", slug: "soustons", postalCode: "40140",
    seoTitle: "Professionnels et commerçants à Soustons",
    intro: [
      "Entre lac et océan, Soustons est l'une des communes les plus prisées du Marensin, avec une activité commerciale et artisanale soutenue toute l'année, renforcée par un tourisme important en saison.",
    ],
    neighbors: ["hossegor", "capbreton", "saint-vincent-de-tyrosse", "castets"],
    lat: 43.7539, lng: -1.3236,
  },
  "hossegor": {
    name: "Hossegor", slug: "hossegor", postalCode: "40150",
    seoTitle: "Professionnels et commerçants à Hossegor",
    intro: [
      "Haut lieu mondial du surf et station balnéaire prisée, Hossegor conjugue un art de vivre recherché et un tissu économique haut de gamme : commerces, restaurants, professionnels du bien-être et prestataires liés aux sports de glisse.",
    ],
    neighbors: ["capbreton", "soustons", "saint-vincent-de-tyrosse"],
    lat: 43.6689, lng: -1.4406,
  },
  "capbreton": {
    name: "Capbreton", slug: "capbreton", postalCode: "40130",
    seoTitle: "Professionnels et commerçants à Capbreton",
    intro: [
      "Ancien port de pêche devenu station balnéaire dynamique, Capbreton allie identité maritime forte et vie économique active, portée par le tourisme et une population résidente croissante.",
    ],
    neighbors: ["hossegor", "soustons", "saint-vincent-de-tyrosse"],
    lat: 43.6431, lng: -1.4319,
  },
  "vieux-boucau-les-bains": {
    name: "Vieux-Boucau-les-Bains", slug: "vieux-boucau-les-bains", postalCode: "40480",
    seoTitle: "Professionnels et commerçants à Vieux-Boucau-les-Bains",
    intro: [
      "Petite station balnéaire familiale au bord de son étang marin, Vieux-Boucau-les-Bains propose un cadre de vie recherché et une offre de commerces et services adaptée à sa population, très renforcée en saison estivale.",
    ],
    neighbors: ["soustons", "castets", "hossegor"],
    lat: 43.7906, lng: -1.3986,
  },
  "sabres": {
    name: "Sabres", slug: "sabres", postalCode: "40630",
    seoTitle: "Professionnels et commerçants à Sabres",
    intro: [
      "Située au cœur du Parc naturel régional des Landes de Gascogne et connue pour son écomusée de la Grande Lande, Sabres est un bourg rural qui conserve un commerce et un artisanat de proximité essentiels à la vie locale.",
    ],
    neighbors: ["labouheyre", "parentis-en-born", "biscarrosse"],
    lat: 44.1461, lng: -0.7375,
  },
  "lit-et-mixe": {
    name: "Lit-et-Mixe", slug: "lit-et-mixe", postalCode: "40170",
    seoTitle: "Professionnels et commerçants à Lit-et-Mixe",
    intro: [
      "Commune littorale entre forêt et océan, Lit-et-Mixe connaît une forte affluence touristique en saison qui dynamise son commerce local et ses prestataires de services.",
    ],
    neighbors: ["castets", "mimizan", "soustons"],
    lat: 44.0272, lng: -1.2678,
  },
};

/** Slug de ville : cherche dans CITY_META, sinon génère depuis le libellé. */
export function citySlug(cityName: string): string {
  const entry = Object.values(CITY_META).find(c => c.name.toLowerCase() === cityName.toLowerCase());
  return entry ? entry.slug : slugify(cityName);
}

/** Retrouve la métadonnée d'une ville à partir de son slug. */
export function cityMetaFromSlug(slug: string): CityMeta | null {
  return CITY_META[slug] || null;
}
