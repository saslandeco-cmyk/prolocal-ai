import { dbGetProfessionalsByCategory } from "@/lib/db/professionals";
import { getListingRank } from "@/lib/listingOrder";
import { haversineKm } from "@/lib/geo/distance";
import { CITY_META } from "@/lib/cityData";
import type { NeedRequest } from "@/types/needs";
import type { MatchedProfessionalResult } from "@/types/needs";

const DEFAULT_RADIUS_KM = 30;

function cityCoords(communeName: string | null): { lat: number; lng: number } | null {
  if (!communeName) return null;
  const meta = Object.values(CITY_META).find(
    (c) => c.name.toLowerCase() === communeName.toLowerCase()
  );
  return meta ? { lat: meta.lat, lng: meta.lng } : null;
}

/**
 * Recherche les professionnels réellement présents dans la base Prolocal
 * (table `professionals`, statut actif) qui correspondent au besoin
 * structuré. Ne retourne QUE des fiches existantes — aucune donnée générée.
 *
 * Stratégie volontairement simple pour la V1 (cohérente avec le reste du
 * site, voir AnnuaireSearchClient/CategoryPage) : on charge les fiches de la
 * catégorie visée, puis on filtre/trie en mémoire par sous-catégorie et
 * proximité géographique. Le volume de fiches par catégorie reste faible à
 * l'échelle d'un département, donc pas de sur-ingénierie nécessaire ici.
 */
export async function matchProfessionals(
  need: NeedRequest,
  opts: { radiusKm?: number } = {}
): Promise<MatchedProfessionalResult[]> {
  if (!need.categorie) return [];

  const radiusKm = opts.radiusKm ?? DEFAULT_RADIUS_KM;
  const candidates = await dbGetProfessionalsByCategory(need.categorie);
  const refCoords = cityCoords(need.commune);

  const scored: MatchedProfessionalResult[] = candidates.map((professional) => {
    let matchScore = 10; // correspondance de catégorie de base
    let distanceKm: number | null = null;

    if (need.sousCategorie && professional.subcategory === need.sousCategorie) {
      matchScore += 5;
    }

    if (need.commune && professional.city?.toLowerCase() === need.commune.toLowerCase()) {
      matchScore += 20;
      distanceKm = 0;
    } else if (refCoords && professional.lat != null && professional.lng != null) {
      distanceKm = haversineKm(refCoords.lat, refCoords.lng, professional.lat, professional.lng);
      if (distanceKm <= radiusKm) {
        matchScore += Math.max(0, 15 - distanceKm / 5);
      }
    }

    // La visibilité (plan payant) départage les fiches à pertinence égale,
    // jamais la pertinence elle-même — cohérent avec getListingRank ailleurs.
    matchScore -= getListingRank(professional);

    return { professional, distanceKm, matchScore };
  });

  const withLocation = need.commune
    ? scored.filter((r) => {
        const exactCity = r.professional.city?.toLowerCase() === need.commune!.toLowerCase();
        const withinRadius = r.distanceKm !== null && r.distanceKm <= radiusKm;
        return exactCity || withinRadius;
      })
    : scored;

  return withLocation.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
}
