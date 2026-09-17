/**
 * Structure du besoin exprimé en langage naturel par l'utilisateur, une fois
 * interprété par le moteur PROLOCAL AI (src/lib/ai/needParser.ts).
 *
 * Volontairement extensible : tous les champs au-delà de `rawText` sont
 * optionnels, pour pouvoir enrichir la compréhension au fil du temps
 * (budget, disponibilité...) sans casser les appelants existants.
 */
export interface NeedRequest {
  rawText: string;
  besoin: string | null;
  categorie: string | null;
  sousCategorie: string | null;
  commune: string | null;
  departement: string;
  urgence: "immediate" | "cette_semaine" | null;
  typeDemande: "service" | "produit" | "information" | null;
  budget: string | null;
  disponibilite: string | null;
  motsCles: string[];
  /** true si aucune commune n'a pu être identifiée dans le texte — l'appelant doit alors la demander explicitement. */
  localisationManquante: boolean;
  /** true si aucune catégorie n'a pu être déterminée avec confiance. */
  categorieIncertaine: boolean;
  /** Origine de l'interprétation : dictionnaire local seul, ou complété par un LLM. */
  source: "local" | "llm";
}

export interface MatchedProfessionalResult {
  professional: import("./index").Professional;
  distanceKm: number | null;
  matchScore: number;
}

export interface NeedSearchResponse {
  need: NeedRequest;
  results: MatchedProfessionalResult[];
  /** Message de compréhension à afficher à l'utilisateur, ex: "Nous avons compris que...". */
  message: string;
  /** true si l'utilisateur doit préciser sa commune avant d'afficher des résultats. */
  needsLocation: boolean;
}

export type DemandeStatus = "nouvelle" | "en_cours" | "repondue" | "acceptee" | "terminee" | "annulee";

/**
 * Demande de devis/contact envoyée à un professionnel depuis le parcours
 * PROLOCAL AI, après confirmation explicite de l'utilisateur. Rattachée à un
 * `Professional.id` réel — jamais générée automatiquement.
 */
export interface Demande {
  id: string;
  professionalId: string;
  besoin: string | null;
  categorie: string | null;
  sousCategorie: string | null;
  commune: string | null;
  messageOriginal: string;
  demandeurNom: string;
  demandeurEmail: string | null;
  demandeurTelephone: string | null;
  status: DemandeStatus;
  reponsePro: string | null;
  createdAt: string;
  updatedAt: string;
}
