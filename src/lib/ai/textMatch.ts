/**
 * Utilitaires de correspondance texte partagés entre l'interprétation du
 * besoin (needParser.ts) et le moteur de matching (matchProfessionals.ts).
 */

/** Minuscule + sans accents + apostrophes normalisées, pour un matching robuste. */
export function normalize(text: string): string {
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
export function containsWholeWord(text: string, keyword: string): boolean {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`);
  return pattern.test(text);
}

/** Retire les balises HTML d'une description (stockée en HTML dans Professional.description). */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
