import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { searchEntreprises } from "@/lib/sirene/db";

/**
 * GET /api/entreprises
 *
 * API interne de recherche dans la base des entreprises actives des Landes
 * (données SIRENE synchronisées quotidiennement — voir étapes 1 et 2).
 *
 * Paramètres (tous facultatifs, combinables) :
 *   q            — recherche texte (dénomination, enseigne)
 *   codeApe      — un ou plusieurs codes APE séparés par des virgules (recherche "par métier")
 *   commune      — filtre par commune (contient, insensible à la casse)
 *   codePostal   — filtre par code postal exact
 *   page         — page de résultats (défaut 1)
 *   perPage      — résultats par page (défaut 25, max 100)
 *
 * Exemple : /api/entreprises?codeApe=43.21A&commune=Dax&page=1
 */
export async function GET(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json(
      { error: "Base de données non configurée (POSTGRES_URL manquante)." },
      { status: 503 }
    );
  }

  try {
    const params = req.nextUrl.searchParams;
    const q = params.get("q") || undefined;
    const codeApeParam = params.get("codeApe");
    const codesApe = codeApeParam ? codeApeParam.split(",").map(c => c.trim()).filter(Boolean) : undefined;
    const commune = params.get("commune") || undefined;
    const codePostal = params.get("codePostal") || undefined;
    const page = params.get("page") ? parseInt(params.get("page")!, 10) : 1;
    // Plafond documenté ci-dessus (100) propre à cette route publique, pour
    // qu'une élévation future de la limite interne de searchEntreprises()
    // (ex. pour la liste de sélection en masse de l'admin) n'augmente pas
    // d'elle-même le volume exposé sans authentification.
    const rawPerPage = params.get("perPage") ? parseInt(params.get("perPage")!, 10) : 25;
    const perPage = Math.min(100, Math.max(1, Number.isFinite(rawPerPage) ? rawPerPage : 25));

    const result = await searchEntreprises({ q, codesApe, commune, codePostal, page, perPage });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/entreprises GET] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la recherche." }, { status: 500 });
  }
}
