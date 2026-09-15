import { NextRequest, NextResponse } from "next/server";
import { dbDeleteCategory, CategoryInUseError } from "@/lib/db/categories";

/** DELETE /api/db/categories/[id] → supprime une catégorie (refusé si des professionnels y sont rattachés) */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbDeleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof CategoryInUseError) {
      return NextResponse.json({ error: err.message, count: err.count }, { status: 409 });
    }
    console.error("[api/db/categories/[id] DELETE] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la suppression de la catégorie." }, { status: 500 });
  }
}
