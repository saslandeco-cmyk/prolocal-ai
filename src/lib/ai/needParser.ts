import { CITY_META } from "@/lib/cityData";
import { NEED_RULES, STOPWORDS } from "./needDictionary";
import type { NeedRequest } from "@/types/needs";

/** Minuscule + sans accents + apostrophes normalisées, pour un matching robuste. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Vrai si `keyword` apparaît dans `text` en tant que mot/expression entière
 * (bornée par un début/fin de chaîne ou un caractère non alphabétique) —
 * évite les faux positifs de sous-chaîne, ex: "menage" ne doit PAS matcher
 * à l'intérieur de "demenager".
 */
function containsWholeWord(text: string, keyword: string): boolean {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`);
  return pattern.test(text);
}

/** Cherche une commune des Landes mentionnée dans le texte (CITY_META). */
function detectCommune(normalizedText: string): string | null {
  for (const meta of Object.values(CITY_META)) {
    const normName = normalize(meta.name);
    if (containsWholeWord(normalizedText, normName)) return meta.name;
  }
  return null;
}

/** Score chaque règle du dictionnaire par nombre de mots-clés trouvés, retient la meilleure. */
function detectCategory(normalizedText: string): { categorie: string; sousCategorie: string | null; score: number } | null {
  let best: { categorie: string; sousCategorie: string | null; score: number } | null = null;
  for (const rule of NEED_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (containsWholeWord(normalizedText, normalize(kw))) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { categorie: rule.categorie, sousCategorie: rule.sousCategorie, score };
    }
  }
  return best;
}

function detectUrgence(normalizedText: string): NeedRequest["urgence"] {
  const immediate = ["urgent", "urgence", "rapidement", "au plus vite", "des que possible", "dqp", "tout de suite", "aujourd'hui", "aujourdhui"];
  const semaine = ["cette semaine", "dans la semaine", "prochainement"];
  if (immediate.some(k => containsWholeWord(normalizedText, normalize(k)))) return "immediate";
  if (semaine.some(k => containsWholeWord(normalizedText, normalize(k)))) return "cette_semaine";
  return null;
}

function detectTypeDemande(normalizedText: string): NeedRequest["typeDemande"] {
  const produit = ["acheter", "achat de", "vendre", "a vendre"];
  const information = ["renseignement", "information", "savoir si", "quel est", "combien coute", "combien ca coute"];
  if (produit.some(k => containsWholeWord(normalizedText, normalize(k)))) return "produit";
  if (information.some(k => containsWholeWord(normalizedText, normalize(k)))) return "information";
  return "service";
}

function extractKeywords(normalizedText: string): string[] {
  const words = normalizedText
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));
  return Array.from(new Set(words)).slice(0, 8);
}

/**
 * Interprétation 100% locale d'un besoin exprimé en langage naturel — aucun
 * appel réseau, aucune clé API nécessaire. Suffit pour la majorité des
 * formulations courantes (voir needDictionary.ts). Le fallback LLM optionnel
 * (llmFallback.ts) n'est tenté qu'en cas d'ambiguïté, côté route API.
 */
export function parseNeedLocally(rawText: string): NeedRequest {
  const normalized = normalize(rawText);
  const commune = detectCommune(normalized);
  const categoryMatch = detectCategory(normalized);

  return {
    rawText,
    besoin: categoryMatch?.sousCategorie ?? categoryMatch?.categorie ?? null,
    categorie: categoryMatch?.categorie ?? null,
    sousCategorie: categoryMatch?.sousCategorie ?? null,
    commune,
    departement: "40",
    urgence: detectUrgence(normalized),
    typeDemande: detectTypeDemande(normalized),
    budget: null,
    disponibilite: null,
    motsCles: extractKeywords(normalized),
    localisationManquante: commune === null,
    categorieIncertaine: categoryMatch === null,
    source: "local",
  };
}
