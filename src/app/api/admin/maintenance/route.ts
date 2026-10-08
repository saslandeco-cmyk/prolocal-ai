import { NextRequest, NextResponse } from "next/server";
import { dbGetMaintenanceStatus, dbSetMaintenanceStatus, DEFAULT_MAINTENANCE_MESSAGE } from "@/lib/db/siteSettings";

/**
 * GET  /api/admin/maintenance → statut actuel (activé/désactivé + message)
 * POST /api/admin/maintenance → met à jour le statut, depuis l'onglet
 *                                Personnalisation de l'admin.
 *
 * Toujours dynamique (jamais mis en cache) : l'admin doit voir l'état réel
 * du statut en base à chaque appel, jamais une valeur potentiellement
 * périmée.
 */
export const dynamic = "force-dynamic";
export async function GET() {
  const status = await dbGetMaintenanceStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const enabled = Boolean(body.enabled);
    const message = typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : DEFAULT_MAINTENANCE_MESSAGE;
    await dbSetMaintenanceStatus(enabled, message);
    return NextResponse.json({ ok: true, enabled, message });
  } catch (err: any) {
    console.error("[api/admin/maintenance POST] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la mise à jour du mode maintenance." }, { status: 500 });
  }
}
