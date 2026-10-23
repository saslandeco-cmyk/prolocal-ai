import { NextRequest, NextResponse } from "next/server";
import { dbAddContactRecharge, dbGetAllContactCreditTotals, dbGetTotalContactCredits } from "@/lib/db/contactRecharges";

/**
 * GET  /api/admin/contact-credits
 * Totaux de mises en contact achetées, pour toutes les fiches ayant au
 * moins une recharge — utilisé par l'export CSV admin (colonne "Mises en
 * contact"). Les fiches absentes du résultat ont un total de 0.
 */
export async function GET() {
  const credits = await dbGetAllContactCreditTotals();
  return NextResponse.json({ credits });
}

/**
 * POST /api/admin/contact-credits
 * Ajuste le total de mises en contact d'une fiche à la valeur cible
 * demandée (import CSV admin) : calcule l'écart avec le total actuel et
 * l'enregistre comme une nouvelle recharge (positive ou négative), pour
 * garder un historique cohérent plutôt que de réécrire les recharges
 * existantes.
 *
 * Body attendu : { proId: string, targetTotal: number }.
 */
export async function POST(req: NextRequest) {
  const { proId, targetTotal } = await req.json();
  if (!proId || typeof targetTotal !== "number" || targetTotal < 0) {
    return NextResponse.json({ error: "proId et targetTotal (nombre positif) sont requis." }, { status: 400 });
  }
  const current = await dbGetTotalContactCredits(proId);
  const delta = targetTotal - current;
  if (delta !== 0) await dbAddContactRecharge(proId, delta);
  return NextResponse.json({ ok: true, newTotal: current + delta });
}
