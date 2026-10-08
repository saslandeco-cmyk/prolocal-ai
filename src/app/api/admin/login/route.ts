import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, ADMIN_AUTH_COOKIE_MAX_AGE, adminAuthTokenInput } from "@/lib/adminAuthCookie";

/**
 * POST /api/admin/login → vérifie les identifiants administrateur.
 *
 * La vérification a lieu côté serveur, contre les variables d'environnement
 * ADMIN_USERNAME / ADMIN_PASSWORD (jamais commitées dans le dépôt — voir
 * .env.local.example). Aucun identifiant n'est codé en dur dans le code
 * source ni envoyé au navigateur avant authentification.
 *
 * Pose aussi un cookie HttpOnly (voir src/lib/adminAuthCookie.ts) que le
 * middleware peut lire — indépendamment de la session client en
 * localStorage (src/lib/storage.ts), invisible côté serveur — pour laisser
 * l'administrateur connecté voir le site public normalement même quand le
 * mode maintenance est actif pour les autres visiteurs.
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
      const token = createHash("sha256").update(adminAuthTokenInput(expectedPassword)).digest("hex");
      const res = NextResponse.json({ ok: true });
      res.cookies.set(ADMIN_AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_AUTH_COOKIE_MAX_AGE,
      });
      return res;
    }
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
  } catch (err: any) {
    console.error("[api/admin/login POST] Erreur:", err);
    return NextResponse.json({ error: "Erreur lors de la connexion." }, { status: 500 });
  }
}
