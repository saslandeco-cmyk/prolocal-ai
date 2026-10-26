import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/lib/db/client";
import { dbGetAllProfessionals, dbSaveProfessional, dbGetProfessionalsByCategory, dbMarkMigrated } from "@/lib/db/professionals";
import { uploadProfessionalImages } from "@/lib/blob";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import { sanitizeDescriptionHtml } from "@/lib/sanitizeHtml";

// Seuil volontairement généreux : cette route sert aussi bien l'écriture
// ponctuelle (inscription, revendication, édition dashboard) que l'import
// CSV en masse depuis l'admin (potentiellement des centaines de lignes en
// quelques minutes depuis la même IP) — l'objectif est de freiner un bot
// créant des fiches en masse, pas de gêner un usage légitime.
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * GET  /api/db/professionals            → liste tous les professionnels
 * GET  /api/db/professionals?category=X → filtre par catégorie (actifs uniquement)
 * POST /api/db/professionals            → crée ou met à jour un professionnel (upsert)
 *
 * Utilisées par la double-écriture automatique (étape 2), la synchronisation
 * à la connexion et la migration en masse depuis l'admin (étape 4).
 */
export async function GET(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  try {
    const category = req.nextUrl.searchParams.get("category");
    const professionals = category
      ? await dbGetProfessionalsByCategory(category)
      : await dbGetAllProfessionals();
    return NextResponse.json({ professionals });
  } catch (err: any) {
    console.error("[api/db/professionals GET] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la lecture des professionnels." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  try {
    const ip = getClientIp(req);
    if (isRateLimited(`professionals-post:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json({ error: "Trop de requêtes récentes. Merci de réessayer dans quelques instants." }, { status: 429 });
    }

    const pro = await req.json();
    if (!pro?.id || !pro?.companyName) {
      return NextResponse.json({ error: "Objet Professional invalide (id et companyName requis)." }, { status: 400 });
    }
    // Nettoie le HTML de la description (éditeur de texte riche) avant tout
    // enregistrement — elle est affichée sans échappement (dangerouslySetInnerHTML)
    // sur la fiche publique et le tableau de bord. Voir src/lib/sanitizeHtml.ts.
    if (typeof pro.description === "string") {
      pro.description = sanitizeDescriptionHtml(pro.description);
    }
    // Remplace toute image encore en base64 (logo/bannière/photos) par son
    // URL Vercel Blob avant écriture — évite d'alourdir durablement la
    // colonne JSONB lue par toutes les pages publiques (voir src/lib/blob.ts).
    await dbSaveProfessional(await uploadProfessionalImages(pro));
    await dbMarkMigrated(pro.id);
    // Les pages publiques (accueil, catégories, sous-catégories, villes,
    // fiches) sont statiques avec ISR (revalidate = 3600) : sans cette
    // invalidation, une fiche importée/éditée reste invisible côté front
    // jusqu'à 1h, alors qu'elle apparaît immédiatement en admin (lecture
    // live, non cachée) — ce qui donne l'impression à tort d'un bug de
    // catégorie ou de statut. Toutes les pages partagent le layout racine,
    // donc 'layout' les régénère en une seule fois à la prochaine visite.
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/db/professionals POST] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'enregistrement du professionnel." }, { status: 500 });
  }
}
