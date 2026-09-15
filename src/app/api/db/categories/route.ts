import { NextRequest, NextResponse } from "next/server";
import { dbGetCategories, dbSaveCategory, dbSeedCategoriesIfEmpty } from "@/lib/db/categories";

/**
 * GET  /api/db/categories          → catalogue effectif (base si dispo, sinon valeurs par défaut)
 * GET  /api/db/categories?admin=1  → amorce la base si vide puis retourne le catalogue complet, pour l'admin
 * POST /api/db/categories          → crée ou met à jour une catégorie (upsert)
 */
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("admin") === "1") {
      await dbSeedCategoriesIfEmpty();
    }
    const categories = await dbGetCategories();
    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error("[api/db/categories GET] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la lecture des catégories." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.label || typeof body.label !== "string") {
      return NextResponse.json({ error: "Le libellé de la catégorie est requis." }, { status: 400 });
    }
    const result = await dbSaveCategory({
      id: body.id || undefined,
      label: body.label.trim(),
      emoji: body.emoji || "🏷️",
      order: body.order ?? 0,
      seoTitle: body.seoTitle || body.label.trim(),
      subtitle: body.subtitle || "",
      seoText: Array.isArray(body.seoText) ? body.seoText : [],
      ctaText: body.ctaText || "",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[api/db/categories POST] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'enregistrement de la catégorie." }, { status: 500 });
  }
}
