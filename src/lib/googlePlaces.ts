/**
 * Client Google Places API (Place Details) — récupère la note moyenne et
 * le nombre d'avis Google d'un établissement, à partir de son "Place ID"
 * (renseigné par le professionnel dans son tableau de bord).
 *
 * Utilisé pour enrichir les données structurées SEO (`aggregateRating`)
 * des fiches professionnelles avec les avis Google, en complément des
 * avis internes Prolocal-Landes.
 *
 * ⚠️ Nécessite la variable d'environnement GOOGLE_PLACES_API_KEY (API
 * "Places API (New)" activée sur Google Cloud Console, avec facturation
 * activée — le champ "rating"/"userRatingCount" reste dans le niveau
 * gratuit de l'API Places dans la plupart des cas d'usage à faible volume,
 * mais reste soumis aux tarifs Google). Sans cette clé, la fonction
 * retourne `null` silencieusement — aucune fiche ne casse, l'avis Google
 * est simplement absent des données structurées.
 *
 * Résultat mis en cache en mémoire (process) pendant 24h par Place ID,
 * pour éviter un appel Google à chaque génération de page.
 */

export interface GoogleRating {
  rating: number;
  reviewCount: number;
  googleMapsUrl?: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const cache = new Map<string, { data: GoogleRating | null; expiresAt: number }>();

export async function getGoogleRating(placeId: string | undefined | null): Promise<GoogleRating | null> {
  if (!placeId) return null;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const cached = cache.get(placeId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri",
      },
      // Revalidation Next.js alignée sur le cache mémoire ci-dessus
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) {
      cache.set(placeId, { data: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const data = await res.json();
    if (typeof data.rating !== "number" || typeof data.userRatingCount !== "number") {
      cache.set(placeId, { data: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const result: GoogleRating = {
      rating: data.rating,
      reviewCount: data.userRatingCount,
      googleMapsUrl: data.googleMapsUri,
    };
    cache.set(placeId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    // Silencieux : une indisponibilité de l'API Google ne doit jamais
    // faire échouer le rendu d'une fiche professionnelle.
    return null;
  }
}

export interface GoogleReview {
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface GoogleReviewsData extends GoogleRating {
  reviews: GoogleReview[];
}

// Cache séparé de celui de getGoogleRating() ci-dessus : le champ "reviews"
// de l'API Places relève d'un niveau de facturation Google plus élevé
// (Enterprise + Atmosphere) que "rating"/"userRatingCount" seuls (Essentials/
// Pro) — on ne veut jamais faire basculer silencieusement le JSON-LD
// (aggregateRating, généré via getGoogleRating) sur ce niveau plus coûteux.
const reviewsCache = new Map<string, { data: GoogleReviewsData | null; expiresAt: number }>();

/**
 * Récupère la note, le nombre d'avis ET le contenu des avis Google les plus
 * pertinents (jusqu'à 5, fournis par l'API Places — pas de pagination
 * possible) d'un établissement, pour les afficher sur sa fiche publique.
 * Mêmes garanties que getGoogleRating() : jamais de clé API, jamais de
 * champ "googlePlaceId" renseigné, ou toute erreur réseau → `null`
 * silencieux, la fiche s'affiche normalement sans cette section.
 */
export async function getGoogleReviews(placeId: string | undefined | null): Promise<GoogleReviewsData | null> {
  if (!placeId) return null;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const cached = reviewsCache.get(placeId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) {
      reviewsCache.set(placeId, { data: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const data = await res.json();
    if (typeof data.rating !== "number" || typeof data.userRatingCount !== "number") {
      reviewsCache.set(placeId, { data: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const reviews: GoogleReview[] = Array.isArray(data.reviews)
      ? data.reviews
          .map((r: any) => ({
            authorName: r.authorAttribution?.displayName || "Utilisateur Google",
            authorPhotoUrl: r.authorAttribution?.photoUri || undefined,
            rating: typeof r.rating === "number" ? r.rating : 0,
            text: r.text?.text || r.originalText?.text || "",
            relativeTime: r.relativePublishTimeDescription || "",
          }))
          .filter((r: GoogleReview) => r.text.trim().length > 0)
      : [];

    const result: GoogleReviewsData = {
      rating: data.rating,
      reviewCount: data.userRatingCount,
      googleMapsUrl: data.googleMapsUri,
      reviews,
    };
    reviewsCache.set(placeId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    // Silencieux : une indisponibilité de l'API Google ne doit jamais
    // faire échouer le rendu d'une fiche professionnelle.
    return null;
  }
}

/**
 * Combine la note interne Prolocal-Landes et la note Google en une seule
 * note moyenne pondérée par le nombre d'avis de chaque source — pour un
 * `aggregateRating` unique et représentatif dans les données structurées.
 */
export function combineRatings(
  internal: { avg: number; count: number } | null,
  google: GoogleRating | null
): { avg: number; count: number } | null {
  const hasInternal = internal && internal.count > 0;
  const hasGoogle = google && google.reviewCount > 0;

  if (!hasInternal && !hasGoogle) return null;
  if (hasInternal && !hasGoogle) return internal;
  if (!hasInternal && hasGoogle) return { avg: google!.rating, count: google!.reviewCount };

  const totalCount = internal!.count + google!.reviewCount;
  const weightedSum = internal!.avg * internal!.count + google!.rating * google!.reviewCount;
  return { avg: Math.round((weightedSum / totalCount) * 10) / 10, count: totalCount };
}
