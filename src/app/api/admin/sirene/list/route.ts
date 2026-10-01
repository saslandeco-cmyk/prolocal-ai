import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { searchEntreprises, getEntreprisesCount } from "@/lib/sirene/db";

/**
 * GET /api/admin/sirene/list
 * Réutilise la recherche interne (étape 3) pour le panneau admin, avec le
 * total global de la base en plus (indicateur de volume).
 */
export async function GET(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json({ entreprises: [], total: 0, page: 1, totalPages: 0, totalGlobal: 0 });
  }
  try {
    const params = req.nextUrl.searchParams;
    const q = params.get("q") || undefined;
    const codeApeParam = params.get("codeApe");
    const codesApe = codeApeParam ? [codeApeParam] : undefined;
    const page = params.get("page") ? parseInt(params.get("page")!, 10) : 1;

    const [result, totalGlobal] = await Promise.all([
      searchEntreprises({ q, codesApe, page, perPage: 1000 }),
      getEntreprisesCount(),
    ]);

    return NextResponse.json({ ...result, totalGlobal });
  } catch (err: any) {
    console.error("[api/admin/sirene/list] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur." }, { status: 500 });
  }
}
