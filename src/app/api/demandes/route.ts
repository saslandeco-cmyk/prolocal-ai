import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { dbCreateDemande, dbGetDemandesByPro } from "@/lib/db/demandes";
import { dbGetProfessionalById } from "@/lib/db/professionals";
import type { Demande } from "@/types/needs";

/**
 * GET  /api/demandes?proId=X → demandes reçues par un professionnel (dashboard "Demandes reçues")
 * POST /api/demandes         → crée une demande de devis/contact, après confirmation de l'utilisateur
 *
 * La demande est toujours rattachée à un professionnel réellement présent en
 * base (vérifié ci-dessous) — jamais créée pour un id arbitraire envoyé par
 * le client.
 */
export async function GET(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  const proId = req.nextUrl.searchParams.get("proId");
  if (!proId) {
    return NextResponse.json({ error: "Paramètre proId requis." }, { status: 400 });
  }
  try {
    const demandes = await dbGetDemandesByPro(proId);
    return NextResponse.json({ demandes });
  } catch (err: any) {
    console.error("[api/demandes GET] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la lecture des demandes." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const professionalId = typeof body.professionalId === "string" ? body.professionalId : "";
  const demandeurNom = typeof body.demandeurNom === "string" ? body.demandeurNom.trim() : "";
  const demandeurEmail = typeof body.demandeurEmail === "string" ? body.demandeurEmail.trim() : "";
  const demandeurTelephone = typeof body.demandeurTelephone === "string" ? body.demandeurTelephone.trim() : "";
  const messageOriginal = typeof body.messageOriginal === "string" ? body.messageOriginal.trim().slice(0, 1000) : "";

  if (!professionalId || !demandeurNom || !messageOriginal) {
    return NextResponse.json({ error: "professionalId, demandeurNom et messageOriginal sont requis." }, { status: 400 });
  }
  if (!demandeurEmail && !demandeurTelephone) {
    return NextResponse.json({ error: "Merci de renseigner un email ou un téléphone pour que le professionnel puisse vous répondre." }, { status: 400 });
  }

  const professional = await dbGetProfessionalById(professionalId);
  if (!professional) {
    return NextResponse.json({ error: "Professionnel introuvable." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const demande: Demande = {
    id: `demande-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    professionalId,
    besoin: typeof body.besoin === "string" ? body.besoin : null,
    categorie: typeof body.categorie === "string" ? body.categorie : professional.category,
    sousCategorie: typeof body.sousCategorie === "string" ? body.sousCategorie : null,
    commune: typeof body.commune === "string" ? body.commune : null,
    messageOriginal,
    demandeurNom,
    demandeurEmail: demandeurEmail || null,
    demandeurTelephone: demandeurTelephone || null,
    status: "nouvelle",
    reponsePro: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await dbCreateDemande(demande);
    return NextResponse.json({ demande });
  } catch (err: any) {
    console.error("[api/demandes POST] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'enregistrement de la demande." }, { status: 500 });
  }
}
