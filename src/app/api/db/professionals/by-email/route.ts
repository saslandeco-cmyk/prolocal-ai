import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { dbGetProfessionalByEmail } from "@/lib/db/professionals";

/**
 * GET /api/db/professionals/by-email?email=... → une fiche professionnelle
 *
 * Utilisée par la page de connexion (connexion/page.tsx) pour la connexion
 * elle-même et le mot de passe oublié — une fiche créée directement depuis
 * l'admin n'existe qu'en base, jamais dans le localStorage de l'appareil du
 * professionnel qui tente de s'y connecter pour la première fois.
 *
 * Coexiste sans conflit avec la route dynamique [id] au même niveau :
 * Next.js privilégie toujours un segment statique ("by-email") sur un
 * segment dynamique pour un chemin donné (voir aussi categories/[category]
 * vs categories/[category]/[subcategory]).
 */
export async function GET(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json({ error: "Base de données non configurée (POSTGRES_URL manquante)." }, { status: 503 });
  }
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Paramètre 'email' requis." }, { status: 400 });
    }
    const pro = await dbGetProfessionalByEmail(email);
    if (!pro) return NextResponse.json({ error: "Professionnel introuvable." }, { status: 404 });
    return NextResponse.json({ professional: pro });
  } catch (err: any) {
    console.error("[api/db/professionals/by-email GET] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la lecture du professionnel." }, { status: 500 });
  }
}
