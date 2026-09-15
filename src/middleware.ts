import { NextRequest, NextResponse } from "next/server";

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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.ADMIN_SECRET_PATH;

  // Le chemin interne réel ne doit jamais être atteignable directement.
  if (pathname === ADMIN_INTERNAL_PATH || pathname.startsWith(`${ADMIN_INTERNAL_PATH}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  if (secret) {
    const secretPath = `/${secret}`;
    if (pathname === secretPath || pathname.startsWith(`${secretPath}/`)) {
      const url = req.nextUrl.clone();
      url.pathname = ADMIN_INTERNAL_PATH + pathname.slice(secretPath.length);
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
