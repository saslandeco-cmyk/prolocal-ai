/**
 * Dictionnaire besoin → catégorie/sous-catégorie, construit à la main à
 * partir du catalogue CATEGORIES/SUBCATEGORIES existant (src/types/index.ts)
 * — aucune nouvelle catégorie inventée ici. Utilisé par needParser.ts pour
 * une interprétation locale, sans appel LLM, dans les cas courants.
 *
 * Certains besoins réels (déménagement, restaurant, garde d'animaux...) ne
 * correspondent à AUCUNE catégorie du catalogue actuel : c'est volontaire,
 * needParser renverra alors categorieIncertaine=true plutôt que de forcer
 * une correspondance approximative et trompeuse.
 */
export interface CategoryRule {
  categorie: string;
  sousCategorie: string | null;
  keywords: string[];
}

export const NEED_RULES: CategoryRule[] = [
  // ── Bâtiment & Travaux ──
  { categorie: "Bâtiment & Travaux", sousCategorie: "Plombier-chauffagiste", keywords: [
    "fuite d'eau", "fuite eau", "fuite", "plombier", "plomberie", "plomberie sanitaire", "chauffage", "chaudiere",
    "wc bouche", "toilettes bouchees", "canalisation", "robinet", "sanitaire", "salle de bain", "salle de bains",
    "ballon d'eau chaude", "degat des eaux",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Électricien", keywords: [
    "electricite", "electricien", "panne electrique", "disjoncteur", "prise electrique", "tableau electrique",
    "court circuit", "installation electrique", "mise aux normes electrique",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Maçon", keywords: [
    "macon", "maconnerie", "fondation", "beton", "extension maison", "muret", "terrasse beton",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Peintre en bâtiment", keywords: [
    "peintre", "peinture interieure", "peindre un mur", "peindre une piece", "ravalement de facade",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Menuisier", keywords: [
    "menuisier", "menuiserie", "fenetre", "porte d'entree", "volet", "placard sur mesure", "porte de garage",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Carreleur", keywords: [
    "carreleur", "carrelage", "faience", "poser du carrelage",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Couvreur", keywords: [
    "couvreur", "toiture", "toit", "fuite toiture", "tuile", "gouttiere",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Charpentier", keywords: [
    "charpentier", "charpente",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Plaquiste", keywords: [
    "plaquiste", "cloison", "placo", "faux plafond", "isolation interieure",
  ]},
  { categorie: "Bâtiment & Travaux", sousCategorie: "Architecte", keywords: [
    "architecte", "plan de maison", "permis de construire",
  ]},

  // ── Commerce & Vente ──
  { categorie: "Commerce & Vente", sousCategorie: "Électroménager / Multimédia", keywords: [
    "lave linge", "lave-linge", "machine a laver", "refrigerateur", "frigo", "lave vaisselle",
    "electromenager", "reparation four", "four ne fonctionne plus", "seche linge", "reparation tele", "television",
  ]},
  { categorie: "Commerce & Vente", sousCategorie: "Garage automobile", keywords: [
    "garage", "voiture en panne", "pneu", "vidange", "mecanicien", "reparation voiture", "controle technique",
  ]},
  { categorie: "Commerce & Vente", sousCategorie: "Fleuriste", keywords: [
    "fleuriste", "bouquet de fleurs", "livraison de fleurs",
  ]},
  { categorie: "Commerce & Vente", sousCategorie: "Jardinerie", keywords: [
    "jardinerie", "acheter des plantes", "acheter un arbre",
  ]},

  // ── Informatique & Numérique ──
  { categorie: "Informatique & Numérique", sousCategorie: "Agence Web", keywords: [
    "site internet", "site web", "creer mon site", "creation de site", "site vitrine", "site e-commerce", "boutique en ligne",
  ]},
  { categorie: "Informatique & Numérique", sousCategorie: "Informaticien", keywords: [
    "ordinateur en panne", "depannage informatique", "virus ordinateur", "reparation ordinateur", "pc ne demarre plus",
  ]},
  { categorie: "Informatique & Numérique", sousCategorie: "Graphiste", keywords: [
    "logo", "identite visuelle", "graphisme", "creation graphique",
  ]},
  { categorie: "Informatique & Numérique", sousCategorie: "Community manager", keywords: [
    "reseaux sociaux", "community management", "gerer mes reseaux sociaux",
  ]},

  // ── Services à la personne ──
  { categorie: "Services à la personne", sousCategorie: "Travaux de jardinerie", keywords: [
    "jardinier", "jardinage", "tonte de pelouse", "taille de haie", "elagage", "entretien de jardin", "debroussaillage",
  ]},
  { categorie: "Services à la personne", sousCategorie: "Aide à domicile", keywords: [
    "aide a domicile", "auxiliaire de vie", "aide pour personne agee", "aide au quotidien",
  ]},
  { categorie: "Services à la personne", sousCategorie: "Employé de ménage / Repassage", keywords: [
    "menage", "femme de menage", "repassage", "nettoyage de maison", "aide menagere",
  ]},
  { categorie: "Services à la personne", sousCategorie: "Garde d'enfants", keywords: [
    "garde d'enfants", "baby-sitting", "baby sitting", "nounou", "garde d'enfant",
  ]},
  { categorie: "Services à la personne", sousCategorie: "Garde d'animaux", keywords: [
    "garder mon chien", "garde de chien", "garde d'animaux", "garde de chat", "pension pour chien",
    "promener mon chien", "petsitting", "pet-sitting", "pension canine", "garde d'animal",
  ]},
  { categorie: "Services à la personne", sousCategorie: "Assistant informatique et Internet", keywords: [
    "aide informatique a domicile", "apprendre a utiliser mon ordinateur",
  ]},

  // ── Beauté & Bien-être ──
  { categorie: "Beauté & Bien-être", sousCategorie: "Coiffeur", keywords: [
    "coiffeur", "coiffure", "coupe de cheveux", "coloration",
  ]},
  { categorie: "Beauté & Bien-être", sousCategorie: "Esthéticienne", keywords: [
    "esthetique", "soin du visage", "epilation",
  ]},
  { categorie: "Beauté & Bien-être", sousCategorie: "Praticien en massage bien-être", keywords: [
    "massage", "praticien bien-etre",
  ]},
  { categorie: "Beauté & Bien-être", sousCategorie: "Sophrologue / Réflexologue", keywords: [
    "sophrologie", "reflexologie", "gestion du stress",
  ]},

  // ── Immobilier ──
  { categorie: "Immobilier", sousCategorie: "Agence immobilière", keywords: [
    "acheter une maison", "vendre mon appartement", "louer un logement", "agence immobiliere", "estimation immobiliere",
  ]},
  { categorie: "Immobilier", sousCategorie: "Diagnostique technique", keywords: [
    "diagnostic immobilier", "dpe", "diagnostic de performance energetique",
  ]},
  { categorie: "Immobilier", sousCategorie: "Gestionnaire de bien", keywords: [
    "gestion locative", "gerer mon bien",
  ]},

  // ── Sport & Fitness ──
  { categorie: "Sport & Fitness", sousCategorie: "Coach sportif", keywords: [
    "coach sportif", "remise en forme", "coaching sportif",
  ]},
  { categorie: "Sport & Fitness", sousCategorie: "Salle de sport et de fitness", keywords: [
    "salle de sport", "salle de fitness",
  ]},

  // ── Transport de personnes ──
  { categorie: "Transport de personnes", sousCategorie: "Taxi", keywords: [
    "taxi", "transport de personne",
  ]},
  { categorie: "Transport de personnes", sousCategorie: "Ambulance", keywords: [
    "ambulance", "transport medical",
  ]},
  { categorie: "Transport de personnes", sousCategorie: "Déménagement", keywords: [
    "demenagement", "demenager", "demenageur", "aide au demenagement", "transport de meubles", "camion de demenagement",
  ]},

  // ── Restauration ──
  { categorie: "Restauration", sousCategorie: "Restaurant", keywords: [
    "restaurant", "diner au restaurant", "reserver une table", "manger au restaurant", "restaurant pour ce soir",
    "restaurant pour dimanche", "restaurant pour demain soir", "sortie au restaurant",
  ]},
  { categorie: "Restauration", sousCategorie: "Café / Bar", keywords: [
    "bar a proximite", "prendre un verre", "cafe pour bruncher", "bar pour l'apero",
  ]},
  { categorie: "Restauration", sousCategorie: "Traiteur", keywords: [
    "traiteur", "repas pour un evenement", "buffet pour mariage", "traiteur pour reception",
  ]},

  // ── Alimentation & Épicerie ──
  { categorie: "Alimentation & Épicerie", sousCategorie: "Boulangerie / Pâtisserie", keywords: [
    "boulangerie", "patisserie", "acheter du pain",
  ]},
  { categorie: "Alimentation & Épicerie", sousCategorie: "Boucherie / Charcuterie", keywords: [
    "boucherie", "charcuterie",
  ]},
  { categorie: "Alimentation & Épicerie", sousCategorie: "Fromagerie / Crèmerie", keywords: [
    "fromagerie", "fromager", "cremerie", "acheter du fromage", "produits laitiers",
  ]},
  { categorie: "Alimentation & Épicerie", sousCategorie: "Caviste / Marchand de boissons", keywords: [
    "caviste", "acheter du vin", "marchand de vin", "cave a vin",
  ]},
  { categorie: "Alimentation & Épicerie", sousCategorie: "Épicerie fine", keywords: [
    "epicerie fine", "epicerie",
  ]},
  { categorie: "Alimentation & Épicerie", sousCategorie: "Poissonnerie", keywords: [
    "poissonnerie", "poissonnier", "acheter du poisson",
  ]},
  { categorie: "Alimentation & Épicerie", sousCategorie: "Primeurs", keywords: [
    "primeur", "fruits et legumes", "marchand de fruits et legumes",
  ]},
  { categorie: "Alimentation & Épicerie", sousCategorie: "Alimentation générale", keywords: [
    "alimentation generale", "epicerie de quartier", "petite epicerie",
  ]},
];

/** Mots à ignorer lors de l'extraction de mots-clés bruts (stopwords français courants). */
export const STOPWORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "a", "au", "aux",
  "je", "j'ai", "jai", "mon", "ma", "mes", "chez", "moi", "pour", "dans", "sur",
  "avec", "sans", "est", "suis", "ai", "cherche", "recherche", "besoin", "d'un",
  "d'une", "qui", "que", "quelqu'un", "quelquun", "près", "pres", "plus", "ne",
  "pas", "fonctionne", "svp", "merci", "bonjour", "il", "elle", "ce", "cette",
]);
