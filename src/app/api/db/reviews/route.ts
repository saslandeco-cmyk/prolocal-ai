import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { dbGetReviewsByPro, dbSaveReview } from "@/lib/db/reviews";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// Partagé entre le dépôt d'avis public (rare, quelques-uns par visiteur) et
// la modération en masse depuis l'admin (approbation/rejet de plusieurs
// avis à la suite) — seuil choisi pour freiner un bot déposant des faux
// avis en masse sans gêner une session de modération normale.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * GET  /api/db/reviews?proId=X → avis d'un professionnel
 * POST /api/db/reviews         → crée ou met à jour un avis (upsert)
 */
export async function GET(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  const proId = req.nextUrl.searchParams.get("proId");
  if (!proId) {
    return NextResponse.json({ error: "Paramètre proId requis." }, { status: 400 });
  }
  try {
    const reviews = await dbGetReviewsByPro(proId);
    return NextResponse.json({ reviews });
  } catch (err: any) {
    console.error("[api/db/reviews GET] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la lecture des avis." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  try {
    const ip = getClientIp(req);
    if (isRateLimited(`reviews-post:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json({ error: "Trop de requêtes récentes. Merci de réessayer dans quelques instants." }, { status: 429 });
    }

    const review = await req.json();
    if (!review?.id || !review?.proId) {
      return NextResponse.json({ error: "Objet Review invalide (id et proId requis)." }, { status: 400 });
    }
    await dbSaveReview(review);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/db/reviews POST] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'enregistrement de l'avis." }, { status: 500 });
  }
}
