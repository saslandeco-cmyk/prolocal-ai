import { NextRequest, NextResponse } from "next/server";
import { getGoogleRating } from "@/lib/googlePlaces";

/**
 * GET /api/google-rating?placeId=xxx
 *
 * Expose getGoogleRating() (clé GOOGLE_PLACES_API_KEY strictement côté
 * serveur) aux composants client qui ont besoin de combiner la note Google
 * à la note interne en dehors de la fiche professionnelle elle-même — voir
 * ProfessionalCard.tsx (cartes listées dans les pages catégorie/ville/
 * recherche, où les données ne sont pas déjà enrichies côté serveur comme
 * sur annuaire/[...slug]/page.tsx).
 */
export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  const rating = await getGoogleRating(placeId);
  return NextResponse.json({ rating });
}
