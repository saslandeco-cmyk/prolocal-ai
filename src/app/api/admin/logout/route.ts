import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/adminAuthCookie";

// Voir le commentaire équivalent dans /api/admin/login/route.ts — sans
// cela, le Set-Cookie d'effacement du cookie risque d'être strippé par la
// mise en cache par défaut de la réponse.
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/logout → efface le cookie HttpOnly posé par /api/admin/login.
 * Nécessaire car un cookie HttpOnly n'est pas accessible (ni donc
 * supprimable) depuis document.cookie côté client.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
