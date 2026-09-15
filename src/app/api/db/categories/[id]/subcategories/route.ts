import { NextRequest, NextResponse } from "next/server";
import { dbSaveSubcategory } from "@/lib/db/categories";

/** POST /api/db/categories/[id]/subcategories → crée ou met à jour une sous-catégorie (upsert) */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: categoryId } = await params;
    const body = await req.json();
    if (!body?.label || typeof body.label !== "string") {
      return NextResponse.json({ error: "Le libellé de la sous-catégorie est requis." }, { status: 400 });
    }
    const result = await dbSaveSubcategory({
      id: body.id || undefined,
      categoryId,
      label: body.label.trim(),
      order: body.order ?? 0,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[api/db/categories/[id]/subcategories POST] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'enregistrement de la sous-catégorie." }, { status: 500 });
  }
}
