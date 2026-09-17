import { dbGetProfessionalsByCategory, dbGetAllProfessionals } from "@/lib/db/professionals";
import { getNeedResultsRank } from "@/lib/listingOrder";
import { haversineKm } from "@/lib/geo/distance";
import { CITY_META } from "@/lib/cityData";
import { normalize, containsWholeWord, stripHtml } from "@/lib/ai/textMatch";
import type { NeedRequest } from "@/types/needs";
import type { MatchedProfessionalResult } from "@/types/needs";
import type { Professional } from "@/types";

const DEFAULT_RADIUS_KM = 30;
const KEYWORD_MATCH_WEIGHT = 4;

function cityCoords(communeName: string | null): { lat: number; lng: number } | null {
  if (!communeName) return null;
  const meta = Object.values(CITY_META).find(
    (c) => c.name.toLowerCase() === communeName.toLowerCase()
  );
  return meta ? { lat: meta.lat, lng: meta.lng } : null;
}

/**
 * Texte "à propos" d'un professionnel — titre d'activité, description,
 * services et mots-clés SEO (quand renseignés) — utilisé pour faire
 * correspondre les mots-clés du besoin exprimé par l'utilisateur (voir
 * needParser.ts → NeedRequest.motsCles) à ce que le professionnel a
 * lui-même écrit sur sa fiche. Purement un signal de pertinence : ne
 * remplace jamais la correspondance par catégorie, ne génère aucune donnée.
 */
function proSearchableText(pro: Professional): string {
  return normalize(
    [
      pro.companyName,
      pro.activityTitle,
      pro.shortDescription,
      stripHtml(pro.description || ""),
      ...(pro.services || []),
      ...(pro.seoKeywords || []),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function keywordScore(searchableText: string, motsCles: string[]): number {
  return motsCles.filter((kw) => containsWholeWord(searchableText, normalize(kw))).length * KEYWORD_MATCH_WEIGHT;
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
  // Pas de commune demandée : ne filtre pas par localisation.
  return { score: 0, distanceKm: null, withinReach: !need.commune };
}

/**
 * Recherche les professionnels réellement présents dans la base Prolocal
 * (table `professionals`, statut actif) qui correspondent au besoin
 * structuré. Ne retourne QUE des fiches existantes — aucune donnée générée.
 *
 * Deux étapes :
 *  1. Correspondance par catégorie (dbGetProfessionalsByCategory), affinée
 *     par sous-catégorie, localisation et mots-clés trouvés dans le
 *     descriptif du professionnel (à propos, services, mots-clés SEO).
 *  2. Repli mots-clés seuls, sur TOUTES les fiches actives, uniquement si
 *     aucune catégorie n'a été identifiée (ou qu'elle n'a rien donné) — pour
 *     ne pas laisser une recherche bredouille alors qu'un professionnel a
 *     justement écrit le bon mot dans sa fiche.
 *
 * Stratégie volontairement simple (cohérente avec AnnuaireSearchClient /
 * CategoryPage) : filtre/tri en mémoire, le volume de fiches restant faible
 * à l'échelle d'un département.
 */
export async function matchProfessionals(
  need: NeedRequest,
  opts: { radiusKm?: number } = {}
): Promise<MatchedProfessionalResult[]> {
  const radiusKm = opts.radiusKm ?? DEFAULT_RADIUS_KM;
  const refCoords = cityCoords(need.commune);

  const scoreCategoryCandidate = (professional: Professional): MatchedProfessionalResult => {
    let matchScore = 10; // correspondance de catégorie de base
    if (need.sousCategorie && professional.subcategory === need.sousCategorie) matchScore += 5;

    const loc = locationScore(professional, need, refCoords, radiusKm);
    matchScore += loc.score;
    matchScore += keywordScore(proSearchableText(professional), need.motsCles);

    return { professional, distanceKm: loc.distanceKm, matchScore };
  };

  let results: MatchedProfessionalResult[] = [];

  if (need.categorie) {
    const candidates = await dbGetProfessionalsByCategory(need.categorie);
    const scored = candidates.map(scoreCategoryCandidate);
    results = need.commune
      ? scored.filter((r) => {
          const exactCity = r.professional.city?.toLowerCase() === need.commune!.toLowerCase();
          const withinRadius = r.distanceKm !== null && r.distanceKm <= radiusKm;
          return exactCity || withinRadius;
        })
      : scored;
  }

  // Repli mots-clés inter-catégories : uniquement si la catégorie n'a pas
  // permis de trouver de résultat, et qu'il y a effectivement des mots-clés
  // exploitables (sinon rien de fiable à comparer).
  if (results.length === 0 && need.motsCles.length > 0) {
    const all = (await dbGetAllProfessionals()).filter((p) => p.status === "active");
    const scored = all
      .map((professional) => {
        const kwScore = keywordScore(proSearchableText(professional), need.motsCles);
        if (kwScore === 0) return null;
        const loc = locationScore(professional, need, refCoords, radiusKm);
        if (need.commune && !loc.withinReach) return null;
        const matchScore = kwScore + loc.score;
        return { professional, distanceKm: loc.distanceKm, matchScore } as MatchedProfessionalResult;
      })
      .filter((r): r is MatchedProfessionalResult => r !== null);
    results = scored;
  }

  // Ordre d'affichage : formule/coordonnées d'abord (voir getNeedResultsRank),
  // pertinence de la recherche en second critère au sein d'un même palier.
  return results
    .sort((a, b) => {
      const rankDiff = getNeedResultsRank(a.professional) - getNeedResultsRank(b.professional);
      if (rankDiff !== 0) return rankDiff;
      return b.matchScore - a.matchScore;
    })
    .slice(0, 20);
}
