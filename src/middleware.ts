import { NextRequest, NextResponse } from "next/server";
import { dbGetMaintenanceStatus } from "@/lib/db/siteSettings";
import { ADMIN_AUTH_COOKIE, adminAuthTokenInput } from "@/lib/adminAuthCookie";

/**
 * Protection de l'espace admin par chemin secret côté serveur.
 *
 * Le chemin réel de la page (dossier src/app/admin) n'est jamais exposé
 * publiquement : accéder directement à /admin renvoie un 404. Seule l'URL
 * définie par la variable d'environnement ADMIN_SECRET_PATH (jamais
 * commitée dans le dépôt — voir .env.local.example) est réécrite en
 * interne vers /admin. Comme le dépôt GitHub est public, coder ce chemin
 * en dur dans le nom d'un dossier le publierait immédiatement ; en passant
 * par une variable d'environnement (configurée uniquement dans Vercel et/ou
 * .env.local), le vrai chemin n'apparaît jamais dans le code source.
 */
const ADMIN_INTERNAL_PATH = "/admin";

/**
 * Un administrateur authentifié (cookie HttpOnly posé par /api/admin/login,
 * voir src/lib/adminAuthCookie.ts) doit pouvoir continuer à naviguer sur le
 * front office normalement pendant que le mode maintenance affiche la page
 * d'attente à tous les autres visiteurs. Le hachage SHA-256 est recalculé
 * ici via l'API Web Crypto (disponible nativement dans le runtime Edge, à
 * la différence de "node:crypto" utilisé côté route API) à partir du mot
 * de passe admin — jamais stocké en clair dans le cookie.
 */
async function isAuthenticatedAdmin(req: NextRequest): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  const cookie = req.cookies.get(ADMIN_AUTH_COOKIE)?.value;
  if (!password || !cookie) return false;
  const data = new TextEncoder().encode(adminAuthTokenInput(password));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const expected = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  return cookie === expected;
}

function renderMaintenancePage(message: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Maintenance | Prolocal-Landes</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1a3a2a;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;text-align:center}
  .card{max-width:480px}
  .emoji{font-size:48px;margin-bottom:16px}
  h1{font-size:22px;font-weight:700;margin-bottom:12px}
  p{font-size:15px;line-height:1.6;color:rgba(255,255,255,0.8)}
</style>
</head>
<body>
  <div class="card">
    <div class="emoji">🚧</div>
    <h1>Prolocal-Landes</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "3600" },
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.ADMIN_SECRET_PATH;
  const secretPath = secret ? `/${secret}` : null;

  // Le chemin interne réel ne doit jamais être atteignable directement.
  if (pathname === ADMIN_INTERNAL_PATH || pathname.startsWith(`${ADMIN_INTERNAL_PATH}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  if (secretPath && (pathname === secretPath || pathname.startsWith(`${secretPath}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = ADMIN_INTERNAL_PATH + pathname.slice(secretPath.length);
    return NextResponse.rewrite(url);
  }

  // Mode maintenance (activable/désactivable depuis l'admin, sans
  // déploiement — voir src/app/api/admin/maintenance/route.ts). Par
  // construction, l'espace admin (ci-dessus) n'atteint jamais ce point ; les
  // routes API restent explicitement exclues pour que l'administrateur
  // puisse continuer à travailler sur le site pendant qu'elle est active.
  // Un administrateur authentifié (cookie HttpOnly) voit en plus le front
  // office normalement, comme n'importe quel visiteur hors maintenance.
  if (!pathname.startsWith("/api/")) {
    const { enabled, message } = await dbGetMaintenanceStatus();
    if (enabled && !(await isAuthenticatedAdmin(req))) {
      return renderMaintenancePage(message);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
