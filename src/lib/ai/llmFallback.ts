import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, SUBCATEGORIES } from "@/types";
import { CITY_META } from "@/lib/cityData";
import type { NeedRequest } from "@/types/needs";

/**
 * Fallback IA optionnel, appelé UNIQUEMENT quand l'interprétation locale
 * (needParser.ts) est ambiguë (catégorie non trouvée) — jamais à chaque
 * recherche, pour ne pas transformer chaque requête en appel LLM inutile.
 *
 * ⚠️ La clé API reste strictement côté serveur (ANTHROPIC_API_KEY, jamais
 * NEXT_PUBLIC_*) — ce module n'est importé que par des routes API (route.ts),
 * jamais par un composant client. Le LLM n'a le droit d'extraire QUE des
 * champs structurés (catégorie/commune/mots-clés) parmi des valeurs
 * existantes : il ne génère jamais de professionnel, coordonnée ou donnée
 * commerciale — ça reste le rôle exclusif de matchProfessionals.ts sur la
 * base réelle.
 */

export const isLlmFallbackConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

interface LlmExtraction {
  categorie: string | null;
  sousCategorie: string | null;
  commune: string | null;
}

const VALID_CITIES = Object.values(CITY_META).map((c) => c.name);

export async function tryLlmFallback(rawText: string): Promise<LlmExtraction | null> {
  if (!isLlmFallbackConfigured) return null;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 300,
      output_config: { effort: "low" },
      system:
        "Tu extrais une catégorie de service, une sous-catégorie et une commune des Landes " +
        "à partir d'une phrase écrite par un particulier. Réponds UNIQUEMENT avec un objet JSON " +
        `strict de la forme {"categorie": string|null, "sousCategorie": string|null, "commune": string|null}. ` +
        `"categorie" doit être exactement l'une de ces valeurs (ou null si aucune ne convient) : ${CATEGORIES.join(" | ")}. ` +
        `"sousCategorie" doit être une sous-catégorie valide de la catégorie choisie, parmi : ${JSON.stringify(SUBCATEGORIES)}, ou null. ` +
        `"commune" doit être exactement l'une de ces communes des Landes (ou null si aucune n'est mentionnée) : ${VALID_CITIES.join(" | ")}. ` +
        "N'invente aucune autre valeur. Aucun texte hors du JSON.",
      messages: [{ role: "user", content: rawText }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const parsed = JSON.parse(textBlock.text.trim());
    const categorie = typeof parsed.categorie === "string" && CATEGORIES.includes(parsed.categorie) ? parsed.categorie : null;
    const sousCategorie =
      categorie && typeof parsed.sousCategorie === "string" && SUBCATEGORIES[categorie]?.includes(parsed.sousCategorie)
        ? parsed.sousCategorie
        : null;
    const commune = typeof parsed.commune === "string" && VALID_CITIES.includes(parsed.commune) ? parsed.commune : null;

    return { categorie, sousCategorie, commune };
  } catch {
    // Échec silencieux : le résultat de l'interprétation locale reste utilisé tel quel.
    return null;
  }
}

/** Complète un NeedRequest local ambigu avec le résultat du fallback LLM, sans jamais écraser une info déjà trouvée localement. */
export function mergeLlmExtraction(need: NeedRequest, extraction: LlmExtraction | null): NeedRequest {
  if (!extraction) return need;
  return {
    ...need,
    categorie: need.categorie ?? extraction.categorie,
    sousCategorie: need.sousCategorie ?? extraction.sousCategorie,
    besoin: need.besoin ?? extraction.sousCategorie ?? extraction.categorie,
    commune: need.commune ?? extraction.commune,
    localisationManquante: need.commune === null && extraction.commune === null,
    categorieIncertaine: need.categorie === null && extraction.categorie === null,
    source: extraction.categorie || extraction.commune ? "llm" : need.source,
  };
}
