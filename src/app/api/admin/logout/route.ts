import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/adminAuthCookie";

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
