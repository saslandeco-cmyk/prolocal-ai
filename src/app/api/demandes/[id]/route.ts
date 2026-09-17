import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { dbUpdateDemandeStatus } from "@/lib/db/demandes";
import type { DemandeStatus } from "@/types/needs";

const VALID_STATUSES: DemandeStatus[] = ["nouvelle", "en_cours", "repondue", "acceptee", "terminee", "annulee"];

/** PATCH /api/demandes/[id] → change le statut d'une demande (et sa réponse), depuis le dashboard pro. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  const { id } = await params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const status = body.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Statut invalide. Valeurs autorisées : ${VALID_STATUSES.join(", ")}.` }, { status: 400 });
  }
  const reponsePro = typeof body.reponsePro === "string" ? body.reponsePro.slice(0, 2000) : undefined;

  try {
    await dbUpdateDemandeStatus(id, status, reponsePro);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/demandes/[id] PATCH] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la mise à jour de la demande." }, { status: 500 });
  }
}
