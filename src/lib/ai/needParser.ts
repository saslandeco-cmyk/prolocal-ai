import { CITY_META } from "@/lib/cityData";
import { NEED_RULES, STOPWORDS } from "./needDictionary";
import { normalize, containsWholeWord } from "./textMatch";
import type { NeedRequest } from "@/types/needs";

/** Met en forme un nom de commune importé en majuscules (ex: "SAINT-AVIT" → "Saint-Avit"). Laisse intact un nom déjà correctement casé. */
const LOWERCASE_PARTICLES = new Set(["de", "du", "des", "la", "le", "les", "sur", "en", "et"]);
function toDisplayCase(raw: string): string {
  if (raw !== raw.toUpperCase()) return raw; // déjà bien casé (ex: valeurs de CITY_META)
  return raw
    .split(/([\s-])/)
    .map(part => {
      if (part === " " || part === "-") return part;
      const lower = part.toLowerCase();
      return LOWERCASE_PARTICLES.has(lower) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

/**
 * Cherche une commune des Landes mentionnée dans le texte. Vérifie d'abord la
 * liste éditorialisée CITY_META (contenu SEO/coordonnées GPS), puis, si aucune
 * correspondance, les communes réellement présentes dans la base
 * (`extraCities`, transmis par la route API) — pour ne jamais rater une
 * commune où des professionnels sont effectivement enregistrés simplement
 * parce qu'elle n'a pas encore de page SEO dédiée.
 */
function detectCommune(normalizedText: string, extraCities: string[] = []): string | null {
  for (const meta of Object.values(CITY_META)) {
    const normName = normalize(meta.name);
    if (containsWholeWord(normalizedText, normName)) return meta.name;
  }
  for (const raw of extraCities) {
    if (!raw) continue;
    const normName = normalize(raw);
    if (containsWholeWord(normalizedText, normName)) return toDisplayCase(raw);
  }
  return null;
}

export interface CategoryLookup {
  label: string;
  subcategories: string[];
}

/**
 * Repli automatique : si le dictionnaire curé (NEED_RULES) ne trouve rien,
 * cherche si le texte contient directement le nom d'une catégorie ou
 * sous-catégorie du catalogue réel (transmis par la route API, voir
 * dbGetCategories) — couvre ainsi TOUTE catégorie/sous-catégorie existante
 * (y compris créée depuis l'admin ou apparue via un import), sans qu'il soit
 * nécessaire de lui associer des synonymes à la main au préalable.
 */
/**
 * Beaucoup de libellés du catalogue regroupent deux métiers proches sous la
 * forme "X / Y" (ex: "Sophrologue / Réflexologue", "Fromagerie / Crèmerie").
 * On doit reconnaître X ou Y isolément, pas seulement la phrase complète.
 */
function labelVariants(label: string): string[] {
  const parts = label.split("/").map(p => p.trim()).filter(Boolean);
  return parts.length > 1 ? [label, ...parts] : [label];
}

function detectCategoryFromCatalog(
  normalizedText: string,
  catalog: CategoryLookup[]
): { categorie: string; sousCategorie: string | null } | null {
  for (const cat of catalog) {
    for (const sub of cat.subcategories) {
      if (labelVariants(sub).some(v => containsWholeWord(normalizedText, normalize(v)))) {
        return { categorie: cat.label, sousCategorie: sub };
      }
    }
  }
  for (const cat of catalog) {
    if (labelVariants(cat.label).some(v => containsWholeWord(normalizedText, normalize(v)))) {
      return { categorie: cat.label, sousCategorie: null };
    }
  }
  return null;
}

/** Score chaque règle du dictionnaire par nombre de mots-clés trouvés, retient la meilleure. */
function detectCategory(
  normalizedText: string,
  catalog: CategoryLookup[] = []
): { categorie: string; sousCategorie: string | null; score: number } | null {
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
  if (best) return best;

  const labelMatch = detectCategoryFromCatalog(normalizedText, catalog);
  return labelMatch ? { ...labelMatch, score: 1 } : null;
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
export function parseNeedLocally(
  rawText: string,
  extraCities: string[] = [],
  categoryCatalog: CategoryLookup[] = []
): NeedRequest {
  const normalized = normalize(rawText);
  const commune = detectCommune(normalized, extraCities);
  const categoryMatch = detectCategory(normalized, categoryCatalog);

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
