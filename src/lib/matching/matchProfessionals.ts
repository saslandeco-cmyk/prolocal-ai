import { dbGetProfessionalsByCategory, dbGetProfessionalsBySubcategory, dbGetAllProfessionals } from "@/lib/db/professionals";
import { getNeedResultsRank } from "@/lib/listingOrder";
import { haversineKm } from "@/lib/geo/distance";
import { CITY_META } from "@/lib/cityData";
import { normalize, containsWholeWord, stripHtml } from "@/lib/ai/textMatch";
import type { NeedRequest } from "@/types/needs";
import type { MatchedProfessionalResult } from "@/types/needs";
import type { Professional } from "@/types";

export const DEFAULT_RADIUS_KM = 30;
const KEYWORD_MATCH_WEIGHT = 4;
// En dessous de ce score, une seule correspondance de mot-clé générique
// (ex: "création", présent dans d'innombrables descriptions sans rapport —
// fleuriste, céramiste...) ne suffit pas à retenir un professionnel dans un
// repli mots-clés. Un score de service (voir SERVICES_MATCH_WEIGHT) ou au
// moins deux mots-clés distincts dans la description passent ce seuil.
const MIN_KEYWORD_FALLBACK_SCORE = 8;
// Les intitulés de services sont explicitement choisis par le professionnel
// pour décrire ce qu'il propose (jusqu'à 3, voir Professional.services) —
// un mot-clé du besoin qui s'y retrouve est un signal bien plus fort qu'une
// simple occurrence dans le texte libre de la description.
const SERVICES_MATCH_WEIGHT = 10;

function cityCoords(communeName: string | null): { lat: number; lng: number } | null {
  if (!communeName) return null;
  const meta = Object.values(CITY_META).find(
    (c) => c.name.toLowerCase() === communeName.toLowerCase()
  );
  return meta ? { lat: meta.lat, lng: meta.lng } : null;
}

/**
 * Texte "à propos" d'un professionnel — titre d'activité, description
 * longue, mots-clés SEO (quand renseignés) — utilisé pour faire
 * correspondre les mots-clés du besoin exprimé par l'utilisateur (voir
 * needParser.ts → NeedRequest.motsCles) à ce que le professionnel a
 * lui-même écrit sur sa fiche. Les intitulés de services sont traités à
 * part (voir servicesScore) car ils constituent une cible prioritaire.
 * Purement un signal de pertinence : ne remplace jamais la correspondance
 * par catégorie, ne génère aucune donnée.
 */
function proSearchableText(pro: Professional): string {
  return normalize(
    [
      pro.companyName,
      pro.activityTitle,
      pro.shortDescription,
      stripHtml(pro.description || ""),
      ...(pro.seoKeywords || []),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function keywordScore(searchableText: string, motsCles: string[]): number {
  return motsCles.filter((kw) => containsWholeWord(searchableText, normalize(kw))).length * KEYWORD_MATCH_WEIGHT;
}

/**
 * Cible prioritaire : les intitulés de services que le professionnel a
 * lui-même renseignés (jusqu'à 3, ex: "Installation climatisation",
 * "Fromages affinés"). Un mot-clé du besoin qui y correspond pèse plus
 * lourd qu'une simple mention dans la description longue.
 */
function servicesScore(services: string[] | undefined, motsCles: string[]): number {
  if (!services || services.length === 0) return 0;
  const servicesText = normalize(services.join(" "));
  return motsCles.filter((kw) => containsWholeWord(servicesText, normalize(kw))).length * SERVICES_MATCH_WEIGHT;
}

function locationScore(
  pro: Professional,
  need: NeedRequest,
  refCoords: { lat: number; lng: number } | null,
  radiusKm: number
): { score: number; distanceKm: number | null; withinReach: boolean } {
  if (need.commune && pro.city?.toLowerCase() === need.commune.toLowerCase()) {
    return { score: 20, distanceKm: 0, withinReach: true };
  }
  if (refCoords && pro.lat != null && pro.lng != null) {
    const distanceKm = haversineKm(refCoords.lat, refCoords.lng, pro.lat, pro.lng);
    if (distanceKm <= radiusKm) {
      return { score: Math.max(0, 15 - distanceKm / 5), distanceKm, withinReach: true };
    }
    return { score: 0, distanceKm, withinReach: false };
  }
  // Aucune contrainte de localisation exploitable pour cette fiche (ni ville
  // exacte, ni coordonnées comparables au point de référence) : on ne
  // l'exclut que si une contrainte de localisation existe réellement pour
  // cette recherche (commune ou géolocalisation "Autour de moi").
  const noConstraint = !need.commune && !refCoords;
  return { score: 0, distanceKm: null, withinReach: noConstraint };
}

/**
 * Recherche les professionnels réellement présents dans la base Prolocal
 * (table `professionals`, statut actif) qui correspondent au besoin
 * structuré. Ne retourne QUE des fiches existantes — aucune donnée générée.
 *
 * Trois étapes, de la plus précise à la plus large — on ne descend d'un
 * niveau que si le précédent n'a rien donné, et on ne sort JAMAIS de la
 * catégorie identifiée tant qu'une catégorie a pu être déterminée (un mot
 * générique comme "création" ne doit pas faire remonter un fleuriste ou un
 * céramiste pour une recherche de création de site internet) :
 *  1. Correspondance par SOUS-CATÉGORIE quand elle est identifiée
 *     (dbGetProfessionalsBySubcategory) — pas par la catégorie principale,
 *     pour ne pas noyer un besoin précis ("fromagerie") parmi tous les
 *     professionnels de la catégorie parente (toute l'Alimentation &
 *     Épicerie, boulangeries et boucheries comprises).
 *  2. Si la sous-catégorie précise n'a rien donné, repli mots-clés au sein
 *     de la MÊME catégorie seulement (ex: un "Webmaster indépendant" pour
 *     une recherche ayant identifié la sous-catégorie "Agence Web") — exige
 *     un score minimal (MIN_KEYWORD_FALLBACK_SCORE) pour éviter qu'un mot
 *     isolé et générique suffise.
 *  3. Repli mots-clés réellement inter-catégories, sur TOUTES les fiches
 *     actives, uniquement si AUCUNE catégorie n'a pu être identifiée du
 *     tout — pour ne pas laisser une recherche bredouille alors qu'un
 *     professionnel a justement écrit le bon mot dans sa fiche.
 *
 * Dans tous les cas, affinée par localisation et par les mots-clés trouvés
 * dans le descriptif du professionnel (description longue "à propos", titre
 * d'activité, mots-clés SEO) — les intitulés de services (jusqu'à 3, choisis
 * explicitement par le professionnel) constituent une cible prioritaire,
 * pondérée plus fortement (voir servicesScore).
 *
 * Stratégie volontairement simple (cohérente avec AnnuaireSearchClient /
 * CategoryPage) : filtre/tri en mémoire, le volume de fiches restant faible
 * à l'échelle d'un département.
 */
export async function matchProfessionals(
  need: NeedRequest,
  opts: { radiusKm?: number; originOverride?: { lat: number; lng: number } } = {}
): Promise<MatchedProfessionalResult[]> {
  const radiusKm = opts.radiusKm ?? DEFAULT_RADIUS_KM;
  // originOverride : position "Autour de moi" (géolocalisation navigateur),
  // prioritaire sur la commune détectée dans le texte — permet de chercher
  // par rayon sans qu'aucune ville n'ait été identifiée dans la demande.
  const refCoords = opts.originOverride ?? cityCoords(need.commune);
  const hasLocationConstraint = Boolean(need.commune) || Boolean(refCoords);

  const scoreCategoryCandidate = (professional: Professional): MatchedProfessionalResult => {
    let matchScore = 10; // correspondance de base (catégorie ou sous-catégorie)

    const loc = locationScore(professional, need, refCoords, radiusKm);
    matchScore += loc.score;
    matchScore += servicesScore(professional.services, need.motsCles);
    matchScore += keywordScore(proSearchableText(professional), need.motsCles);

    return { professional, distanceKm: loc.distanceKm, matchScore };
  };

  const locationFilter = (r: MatchedProfessionalResult) => {
    const exactCity = Boolean(need.commune) && r.professional.city?.toLowerCase() === need.commune!.toLowerCase();
    const withinRadius = r.distanceKm !== null && r.distanceKm <= radiusKm;
    return exactCity || withinRadius;
  };

  /** Repli mots-clés (services prioritaires) sur un ensemble de candidats déjà réduit. */
  const keywordFallback = (candidates: Professional[]): MatchedProfessionalResult[] =>
    candidates
      .map((professional) => {
        const kwScore = servicesScore(professional.services, need.motsCles) + keywordScore(proSearchableText(professional), need.motsCles);
        if (kwScore < MIN_KEYWORD_FALLBACK_SCORE) return null;
        const loc = locationScore(professional, need, refCoords, radiusKm);
        if (hasLocationConstraint && !loc.withinReach) return null;
        return { professional, distanceKm: loc.distanceKm, matchScore: kwScore + loc.score } as MatchedProfessionalResult;
      })
      .filter((r): r is MatchedProfessionalResult => r !== null);

  let results: MatchedProfessionalResult[] = [];

  if (need.categorie) {
    const candidates = need.sousCategorie
      ? await dbGetProfessionalsBySubcategory(need.categorie, need.sousCategorie)
      : await dbGetProfessionalsByCategory(need.categorie);
    const scored = candidates.map(scoreCategoryCandidate);
    results = hasLocationConstraint ? scored.filter(locationFilter) : scored;

    // Si la sous-catégorie précise n'a rien donné, on cherche un mot-clé fort
    // (service prioritaire ou plusieurs correspondances) au sein de la MÊME
    // catégorie seulement — ex: un "Webmaster indépendant" pour "création
    // site internet" alors que la sous-catégorie détectée était "Agence Web".
    // On ne sort jamais de la catégorie identifiée : un mot générique comme
    // "création" ne doit pas faire remonter un fleuriste ou un céramiste.
    if (results.length === 0 && need.sousCategorie && need.motsCles.length > 0) {
      const sameCategoryPros = await dbGetProfessionalsByCategory(need.categorie);
      results = keywordFallback(sameCategoryPros);
    }
  }

  // Repli mots-clés réellement inter-catégories : uniquement si AUCUNE
  // catégorie n'a pu être identifiée du tout (categorieIncertaine) — jamais
  // quand une catégorie précise est connue mais vide, pour ne pas laisser un
  // mot générique faire apparaître des métiers sans rapport.
  if (results.length === 0 && !need.categorie && need.motsCles.length > 0) {
    const all = (await dbGetAllProfessionals()).filter((p) => p.status === "active");
    results = keywordFallback(all);
  }

  // Ordre d'affichage : formule/coordonnées d'abord (voir getNeedResultsRank),
  // pertinence de la recherche en second critère au sein d'un même palier.
  // Toutes les fiches correspondantes sont retournées (pas de plafond
  // artificiel) — le volume reste faible à l'échelle d'un département.
  return results.sort((a, b) => {
    const rankDiff = getNeedResultsRank(a.professional) - getNeedResultsRank(b.professional);
    if (rankDiff !== 0) return rankDiff;
    return b.matchScore - a.matchScore;
  });
}
