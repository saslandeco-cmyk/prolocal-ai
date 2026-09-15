import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/login → vérifie les identifiants administrateur.
 *
 * La vérification a lieu côté serveur, contre les variables d'environnement
 * ADMIN_USERNAME / ADMIN_PASSWORD (jamais commitées dans le dépôt — voir
 * .env.local.example). Aucun identifiant n'est codé en dur dans le code
 * source ni envoyé au navigateur avant authentification.
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      return NextResponse.json(
        { error: "Accès administrateur non configuré (ADMIN_USERNAME / ADMIN_PASSWORD manquants)." },
        { status: 503 }
      );
    }

    if (username === expectedUsername && password === expectedPassword) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
  } catch (err: any) {
    console.error("[api/admin/login POST] Erreur:", err);
    return NextResponse.json({ error: "Erreur lors de la connexion." }, { status: 500 });
  }
}
