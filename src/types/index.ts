export type PlanType   = "standard" | "premium" | "gold";
export type StatusType = "pending"  | "active"  | "suspended" | "rejected";
export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface Professional {
  id: string;
  companyName: string;
  siren: string;
  siret?: string;
  vatNumber?: string;
  legalForm: string;
  category: string;
  subcategory?: string;
  activityTitle?: string;
  shortDescription?: string;
  description: string;
  website?: string;
  socialLink?: string;
  facebookLink?: string;
  tiktokLink?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  complementaryOptions?: string[];
  paymentMethod?: "cheque" | "card";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  /** true si le dirigeant de l'entreprise a lui-même revendiqué/créé cette fiche */
  claimed?: boolean;
  /**
   * Changement de formule différé : la formule actuelle (pro.plan) reste
   * active jusqu'à la date de renouvellement en cours, puis bascule
   * automatiquement vers targetPlan le lendemain de cette date.
   */
  pendingPlanChange?: {
    targetPlan: "standard" | "premium" | "gold";
    effectiveDate: string; // ISO — lendemain de la date de renouvellement de l'ancienne formule
    newSubscriptionId?: string; // abonnement de la nouvelle formule, déjà créé mais en période d'essai jusqu'à effectiveDate
  };
  // L'option "Encart publicitaire ciblé" utilise la bannière de la fiche
  // du professionnel (pro.banner) — pas d'image dédiée séparée.
  seoKeywords?: string[];
  /**
   * Identifiant "Place ID" Google Business Profile de l'établissement
   * (ex: ChIJN1t_tDeuEmsRUsoyG83frY4). Permet d'afficher la note et le
   * nombre d'avis Google dans les données structurées SEO de la fiche, en
   * complément des avis internes Prolocal-Landes. Facultatif — voir
   * src/lib/googlePlaces.ts pour la configuration (GOOGLE_PLACES_API_KEY).
   */
  googlePlaceId?: string;
  address: string;
  city: string;
  postalCode: string;
  lat?: number;
  lng?: number;
  plan: PlanType;
  status: StatusType;
  logo?: string;
  banner?: string;
  photos?: string[];
  services?: string[];   // 3 services max, 3 mots max chacun
  openingHours?: OpeningHours;
  // Agenda / RDV
  agendaEnabled?: boolean;
  agendaSlotDuration?: number;   // minutes : 15, 30, 45, 60
  agendaStartTime?: string;      // "08:00"
  agendaEndTime?: string;        // "19:00"
  agendaDays?: number[];         // [1,2,3,4,5] = lun-ven
  agendaMessage?: string;        // Message affiché sur le widget
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  password?: string;
}

export interface Appointment {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalEmail: string;
  // Visiteur
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  visitorMessage?: string;
  // Créneau
  date: string;       // "2024-03-15"
  time: string;       // "10:30"
  duration: number;   // minutes
  // Statut
  status: AppointmentStatus;
  createdAt: string;
}

export interface Visit {
  proId:     string;
  date:      string;   // "YYYY-MM-DD"
  hour:      number;   // 0–23
  source:    "direct" | "search" | "category" | "map";
  city?:     string;
}

export interface DailyStats {
  date:   string;
  visits: number;
}

export interface Review {
  id: string;
  proId: string;
  firstName: string;
  lastName: string;
  email: string;
  rating: number;       // 1–5
  text: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  reply?: string;       // réponse du professionnel
  repliedAt?: string;
  flagged?: boolean;    // signalé comme abusif
  flaggedAt?: string;
  verified?: boolean;      // identité de l'auteur vérifiée par code email
  verifiedAt?: string;
}

export interface BlockedDate {
  id: string;
  professionalId: string;
  date: string;           // "2024-12-25"
  allDay: boolean;
  startTime?: string;     // si allDay=false : "09:00"
  endTime?: string;       // si allDay=false : "12:00"
  reason: string;         // "Congés", "Formation", "Absent", "Férié"...
}

export interface OpeningHours {
  alwaysOpen?: boolean;
  monday?:    DayHours;
  tuesday?:   DayHours;
  wednesday?: DayHours;
  thursday?:  DayHours;
  friday?:    DayHours;
  saturday?:  DayHours;
  sunday?:    DayHours;
}

export interface DayHours {
  closed: boolean;
  // Mode d'horaires : journée continue ou coupure matin/après-midi
  mode?: "continuous" | "split";
  // Journée continue
  continuousOpen?:  string;
  continuousClose?: string;
  // Matin — morningEnabled permet de n'activer que le matin (sans après-midi)
  morningEnabled?: boolean;
  morningOpen?:  string;
  morningClose?: string;
  // Après-midi — afternoonEnabled permet de n'activer que l'après-midi (sans matin)
  afternoonEnabled?: boolean;
  afternoonOpen?:  string;
  afternoonClose?: string;
  // Legacy simple (kept for backward compat)
  open?:  string;
  close?: string;
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  features: string[];
  highlight?: boolean;
  color: string;
  bgColor: string;
}

export const PLANS: Plan[] = [
  {
    id: "standard",
    name: "Standard",
    price: 0,
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
    features: [
      "Fiche entreprise",
      "Coordonnées et adresse (téléphone, WhatsApp et email)",
      "1 catégorie",
      "Logo et bannière",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 9,
    highlight: true,
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
    features: [
      "Tout le Standard",
      "5 photos ou images d'illustration",
      "Horaires matin / après-midi",
      "Lien vers votre site web",
      "Mise en avant dans les résultats de recherche de votre commune",
      "Affichage d'1 service",
      "Lien vers 1 réseau social",
      "Collecte d'avis clients",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 29,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 border-yellow-200",
    features: [
      "Tout le Premium",
      "Affichage prioritaire au niveau de tout le département",
      "Badge recommandé",
      "Affichage de 3 services",
      "Liens vers 3 réseaux sociaux",
      "Support prioritaire",
      "Statistiques de visite",
    ],
  },
];

export const CATEGORIES = [
  "Alimentation & Épicerie",
  "Artisanat & Métiers d'art",
  "Bâtiment & Travaux",
  "Beauté & Bien-être",
  "Commerce & Vente",
  "Culture & Élevage",
  "Immobilier",
  "Informatique & Numérique",
  "Restauration",
  "Services à la personne",
  "Sport & Fitness",
  "Transport de personnes",
];

// Sous-catégories disponibles pour certaines catégories (facultatif pour le professionnel)
export const SUBCATEGORIES: Record<string, string[]> = {
  "Alimentation & Épicerie": [
    "Alimentation générale",
    "Boucherie / Charcuterie",
    "Boulangerie / Pâtisserie",
    "Caviste / Marchand de boissons",
    "Épicerie fine",
    "Fromagerie / Crèmerie",
    "Poissonnerie",
    "Primeurs",
  ],
  "Artisanat & Métiers d'art": [
    "Archetier",
    "Bijoutier-Joaillier",
    "Céramiste",
    "Chaudronnier",
    "Décorateur sur céramique / Peintre sur faïence ou porcelaine",
    "Doreur à la feuille",
    "Ébéniste",
    "Encadreur",
    "Ferronnier d'art",
    "Horloger",
    "Luthier",
    "Maroquinier",
    "Souffleur de verre / Verrier à la main",
    "Tailleur de pierre",
    "Tapissier d'ameublement",
    "Vitrailliste",
  ],
  "Bâtiment & Travaux": [
    "Architecte",
    "Carreleur",
    "Charpentier",
    "Couvreur",
    "Électricien",
    "Expert en bâtiment",
    "Maçon",
    "Menuisier",
    "Peintre en bâtiment",
    "Plaquiste",
    "Plombier-chauffagiste",
  ],
  "Beauté & Bien-être": [
    "Coiffeur",
    "Esthéticienne",
    "Maquilleur professionnel",
    "Naturopathe",
    "Praticien en massage bien-être",
    "Prothésiste ongulaire",
    "Sophrologue / Réflexologue",
  ],
  "Commerce & Vente": [
    "Ameublement",
    "Décoration",
    "Électroménager / Multimédia",
    "Ésotérique",
    "Fleuriste",
    "Friperie",
    "Garage automobile",
    "Habillement",
    "Jardinerie",
    "Librairie",
    "Motoculture",
    "Parfumerie",
    "Pharmacie",
    "Tabac / Presse",
    "Troc / Dépôt vente",
  ],
  "Culture & Élevage": [
    "Apiculteur / Apicultrice",
    "Aquaculteur / Aquacultrice",
    "Arboriculteur / Arboricultrice",
    "Éleveur / Éleveuse",
    "Horticulteur / Horticultrice",
    "Maraîcher / Maraîchère",
    "Viticulteur / Viticultrice",
  ],
  "Immobilier": [
    "Agence immobilière",
    "Conciergerie",
    "Diagnostique technique",
    "Gestionnaire de bien",
    "Mandataire immobilier",
    "Syndic de copropriété",
  ],
  "Informatique & Numérique": [
    "Agence Web",
    "Community manager",
    "Cybersécurité",
    "Graphiste",
    "Informaticien",
    "Webdesigner",
    "Webmaster indépendant",
  ],
  "Restauration": [
    "Restaurant",
    "Café / Bar",
    "Traiteur",
  ],
  "Services à la personne": [
    "Aide à domicile",
    "Assistant administratif",
    "Assistant informatique et Internet",
    "Employé de ménage / Repassage",
    "Garde d'animaux",
    "Garde d'enfants",
    "Travaux de jardinerie",
  ],
  "Sport & Fitness": [
    "Coach sportif",
    "Salle de sport et de fitness",
  ],
  "Transport de personnes": [
    "Ambulance",
    "Déménagement",
    "Taxi",
    "Transport de groupe",
  ],
};

export const LANDES_CITIES = [
  "Mont-de-Marsan",
  "Dax",
  "Biscarrosse",
  "Mimizan",
  "Parentis-en-Born",
  "Morcenx",
  "Labouheyre",
  "Castets",
  "Saint-Vincent-de-Tyrosse",
  "Peyrehorade",
  "Hagetmau",
  "Aire-sur-l'Adour",
  "Grenade-sur-l'Adour",
  "Tartas",
  "Soustons",
  "Hossegor",
  "Capbreton",
  "Vieux-Boucau-les-Bains",
  "Sabres",
  "Lit-et-Mixe",
  "Autre commune des Landes",
];

/** Formate les horaires d'un jour en chaîne lisible */
export function formatDayHours(h: DayHours): string {
  if (h.closed) return "Fermé";
  if (h.mode === "continuous" && h.continuousOpen && h.continuousClose)
    return `${h.continuousOpen}–${h.continuousClose}`;
  const parts: string[] = [];
  if ((h.morningEnabled ?? true) && h.morningOpen && h.morningClose)
    parts.push(`${h.morningOpen}–${h.morningClose}`);
  if ((h.afternoonEnabled ?? true) && h.afternoonOpen && h.afternoonClose)
    parts.push(`${h.afternoonOpen}–${h.afternoonClose}`);
  // legacy
  if (!parts.length && h.open && h.close)
    parts.push(`${h.open}–${h.close}`);
  return parts.length ? parts.join(" / ") : "—";
}

// ── Facturation ────────────────────────────────────────────────
export type DocumentType   = "devis" | "facture" | "avoir";
export type DocumentStatus = "brouillon" | "envoyé" | "accepté" | "refusé" | "payé" | "annulé";

export interface DocumentLine {
  id:          string;
  description: string;
  quantity:    number;
  unit:        string;   // ex: "h", "unité", "forfait"
  unitPrice:   number;   // HT
  vatRate:     number;   // 0, 5.5, 10, 20
}

export interface BillingDocument {
  id:            string;
  proId:         string;
  type:          DocumentType;
  status:        DocumentStatus;
  number:        string;   // ex: "DEV-2024-001"
  linkedTo?:     string;   // id du devis (pour facture) ou facture (pour avoir)
  issueDate:     string;   // YYYY-MM-DD
  validityDate?: string;   // pour devis
  dueDate?:      string;   // pour factures
  client: {
    firstName:  string;
    lastName:   string;
    company?:   string;   // Entreprise / Raison sociale (facultatif)
    name:       string;   // calculé : firstName + lastName ou company
    address:    string;
    postalCode: string;
    city:       string;
    email?:     string;
    phone?:     string;
    siret?:     string;
    vatNumber?: string;   // N° TVA intracommunautaire
  };
  issuer: {
    name:        string;
    address:     string;
    postalCode:  string;
    city:        string;
    email:       string;
    phone:       string;
    siren:       string;
    siret?:      string;
    legalForm:   string;
    vatNumber?:  string;   // n° TVA intracommunautaire
    rcs?:        string;   // ex: "RCS Mont-de-Marsan"
    rm?:         string;   // Répertoire des métiers (artisans)
    capital?:    string;   // pour SARL/SAS etc.
    ape?:        string;   // code APE/NAF
  };
  lines:         DocumentLine[];
  discountPct?:  number;    // remise globale %
  notes?:        string;
  paymentTerms?: string;    // "30 jours date de facture"
  paymentMethod?:string;    // "Virement bancaire / Chèque"
  bankDetails?:  string;    // IBAN + BIC
  penalty?:      string;    // pénalités de retard
  lateInterest?: string;    // "3× taux légal"
  recoveryFee?:  string;    // "40€ indemnité forfaitaire"
  createdAt:     string;
  updatedAt:     string;
}

// ── CRM Clients ────────────────────────────────────────────────
export type ClientStatus = "prospect" | "actif" | "inactif" | "vip";

export interface ClientNote {
  id:        string;
  date:      string;
  content:   string;
  type:      "note" | "appel" | "email" | "rdv" | "devis" | "facture";
}

export interface Client {
  id:          string;
  proId:       string;
  // Identité
  firstName:   string;
  lastName:    string;
  company?:    string;
  // Contact
  email?:      string;
  phone?:      string;
  mobile?:     string;
  // Adresse
  address?:    string;
  postalCode?: string;
  city?:       string;
  // Commercial
  status:      ClientStatus;
  source?:     string;   // "annuaire" | "bouche-à-oreille" | "site web" | "réseaux sociaux" | autre
  tags?:       string[];
  // Financier
  siret?:      string;
  vatNumber?:  string;
  // Suivi
  notes:       ClientNote[];
  createdAt:   string;
  updatedAt:   string;
}
