import { NextResponse } from "next/server";
import { parseNeedLocally } from "@/lib/ai/needParser";
import { tryLlmFallback, mergeLlmExtraction } from "@/lib/ai/llmFallback";
import { matchProfessionals } from "@/lib/matching/matchProfessionals";
import type { NeedSearchResponse } from "@/types/needs";

const MAX_LENGTH = 500;
const MIN_LENGTH = 3;

function buildMessage(need: ReturnType<typeof parseNeedLocally>, resultCount: number): string {
  if (need.categorieIncertaine) {
    return "Nous n'avons pas réussi à identifier précisément le type de service recherché. Pouvez-vous préciser votre besoin (le métier ou le type de prestation) ?";
  }
  if (!need.commune) {
    return `Nous avons compris que vous recherchez : ${need.besoin}. Dans quelle ville ou commune des Landes recherchez-vous ce service ?`;
  }
  const suffix = ` à ${need.commune}`;
  if (resultCount === 0) {
    return `Nous avons compris que vous recherchez : ${need.besoin}${suffix}. Nous n'avons malheureusement aucun professionnel correspondant référencé pour le moment dans cette zone.`;
  }
  return `Nous avons compris que vous recherchez : ${need.besoin}${suffix}. Voici les professionnels correspondants près de chez vous.`;
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

  let need = parseNeedLocally(text.trim());

  // Fallback LLM uniquement si l'interprétation locale est ambiguë — jamais systématique.
  if (need.categorieIncertaine || need.localisationManquante) {
    const extraction = await tryLlmFallback(text.trim());
    need = mergeLlmExtraction(need, extraction);
  }

  const results = need.categorie && need.commune ? await matchProfessionals(need) : [];
  const message = buildMessage(need, results.length);

  const response: NeedSearchResponse = {
    need,
    results,
    message,
    needsLocation: !need.categorieIncertaine && !need.commune,
  };
  return NextResponse.json(response);
}
