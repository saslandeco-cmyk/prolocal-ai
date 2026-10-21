import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/cache/clear
 *
 * Force la régénération de toutes les pages publiques mises en cache (ISR,
 * revalidate = 3600 sur les pages catégories/sous-catégories/villes/fiches
 * — voir ces fichiers). Même mécanisme que la double-écriture automatique
 * (src/app/api/db/professionals/route.ts), déclenché ici manuellement
 * depuis l'admin pour les cas où une page semble ne pas refléter une
 * modification récente avant l'expiration naturelle du cache.
 */
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/admin/cache/clear POST] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors du vidage du cache." }, { status: 500 });
  }
}
