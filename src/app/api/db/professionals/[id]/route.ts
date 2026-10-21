import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/lib/db/client";
import { dbGetProfessionalById, dbDeleteProfessional } from "@/lib/db/professionals";

/**
 * GET    /api/db/professionals/[id] → une fiche professionnelle
 * DELETE /api/db/professionals/[id] → supprime une fiche
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  try {
    const { id } = await params;
    const pro = await dbGetProfessionalById(id);
    if (!pro) return NextResponse.json({ error: "Professionnel introuvable." }, { status: 404 });
    return NextResponse.json({ professional: pro });
  } catch (err: any) {
    console.error("[api/db/professionals/[id] GET] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la lecture du professionnel." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  try {
    const { id } = await params;
    await dbDeleteProfessional(id);
    // Voir la note dans POST /api/db/professionals : sans ça, la fiche
    // supprimée resterait visible côté front jusqu'à 1h (ISR).
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/db/professionals/[id] DELETE] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la suppression du professionnel." }, { status: 500 });
  }
}
