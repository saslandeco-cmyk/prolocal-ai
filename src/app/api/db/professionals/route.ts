import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { dbGetAllProfessionals, dbSaveProfessional, dbGetProfessionalsByCategory, dbMarkMigrated } from "@/lib/db/professionals";
import { uploadProfessionalImages } from "@/lib/blob";

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
    const pro = await req.json();
    if (!pro?.id || !pro?.companyName) {
      return NextResponse.json({ error: "Objet Professional invalide (id et companyName requis)." }, { status: 400 });
    }
    // Remplace toute image encore en base64 (logo/bannière/photos) par son
    // URL Vercel Blob avant écriture — évite d'alourdir durablement la
    // colonne JSONB lue par toutes les pages publiques (voir src/lib/blob.ts).
    await dbSaveProfessional(await uploadProfessionalImages(pro));
    await dbMarkMigrated(pro.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/db/professionals POST] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'enregistrement du professionnel." }, { status: 500 });
  }
}
