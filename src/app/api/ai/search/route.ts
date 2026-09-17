import { NextResponse } from "next/server";
import { parseNeedLocally } from "@/lib/ai/needParser";
import { tryLlmFallback, mergeLlmExtraction } from "@/lib/ai/llmFallback";
import { matchProfessionals } from "@/lib/matching/matchProfessionals";
import { dbGetDistinctActiveCities } from "@/lib/db/professionals";
import { dbGetCategories } from "@/lib/db/categories";
import type { NeedSearchResponse } from "@/types/needs";

const MAX_LENGTH = 500;
const MIN_LENGTH = 3;

function buildMessage(need: ReturnType<typeof parseNeedLocally>, resultCount: number): string {
  const hasSignal = need.categorie !== null || need.motsCles.length > 0;
  const label = need.besoin || need.motsCles.join(", ");

  if (!hasSignal) {
    return "Nous n'avons pas réussi à identifier précisément le type de service recherché. Pouvez-vous préciser votre besoin (le métier ou le type de prestation) ?";
  }
  if (!need.commune) {
    return `Nous avons compris que vous recherchez : ${label}. Dans quelle ville ou commune des Landes recherchez-vous ce service ?`;
  }
  const suffix = ` à ${need.commune}`;
  if (resultCount === 0) {
    return `Nous avons compris que vous recherchez : ${label}${suffix}. Nous n'avons malheureusement aucun professionnel correspondant référencé pour le moment dans cette zone.`;
  }
  return `Nous avons compris que vous recherchez : ${label}${suffix}. Voici les professionnels correspondants près de chez vous.`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const text = (body as { text?: unknown })?.text;
  if (typeof text !== "string" || text.trim().length < MIN_LENGTH) {
    return NextResponse.json({ error: "Merci de décrire votre besoin (quelques mots suffisent)." }, { status: 400 });
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ error: `Votre message est trop long (${MAX_LENGTH} caractères maximum).` }, { status: 400 });
  }

  // Communes réellement présentes en base, en complément de la liste éditorialisée
  // CITY_META — sans ça, un besoin dans une commune non "vedette" (import SIRENE)
  // ne serait jamais localisé, même avec des fiches actives à cet endroit.
  const knownCities = await dbGetDistinctActiveCities();

  // Catalogue complet des catégories/sous-catégories (base ou repli codé en
  // dur) — permet de reconnaître automatiquement toute catégorie/sous-catégorie
  // existante par son propre nom, même sans synonymes dédiés dans needDictionary.ts.
  const categories = await dbGetCategories();
  const categoryCatalog = categories.map(c => ({ label: c.label, subcategories: c.subcategories.map(s => s.label) }));

  let need = parseNeedLocally(text.trim(), knownCities, categoryCatalog);

  // Fallback LLM uniquement si l'interprétation locale est ambiguë — jamais systématique.
  if (need.categorieIncertaine || need.localisationManquante) {
    const extraction = await tryLlmFallback(text.trim(), knownCities, categoryCatalog);
    need = mergeLlmExtraction(need, extraction);
  }

  // On tente une recherche dès qu'il y a un signal exploitable (catégorie
  // identifiée OU mots-clés extraits du texte, ex: mots retrouvés dans le
  // descriptif d'un professionnel) — pas seulement quand la catégorie est
  // connue, pour ne pas rater un professionnel dont la fiche correspond au
  // besoin sans que la taxonomie de catégories l'ait explicitement prévu.
  const hasSignal = need.categorie !== null || need.motsCles.length > 0;
  const results = need.commune && hasSignal ? await matchProfessionals(need) : [];
  const message = buildMessage(need, results.length);

  const response: NeedSearchResponse = {
    need,
    results,
    message,
    needsLocation: hasSignal && !need.commune,
  };
  return NextResponse.json(response);
}
