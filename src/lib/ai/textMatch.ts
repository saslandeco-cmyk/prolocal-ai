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

/** Découpe un texte normalisé en mots (lettres/chiffres/apostrophes). */
function words(text: string): string[] {
  return text.match(/[a-z0-9']+/g) || [];
}

/**
 * Distance de Levenshtein — nombre minimal d'insertions/suppressions/
 * substitutions pour transformer `a` en `b`. Implémentation itérative à
 * deux lignes (pas de matrice complète) : suffisant ici, les mots comparés
 * ne dépassent jamais quelques dizaines de caractères.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
}

/** Tolérance d'édition acceptée pour un mot de cette longueur (fautes de frappe plausibles uniquement). */
function toleranceFor(wordLength: number): number {
  if (wordLength <= 4) return 0; // mots courts : trop de faux positifs, pas de tolérance
  if (wordLength <= 7) return 1;
  return 2;
}

/**
 * Vrai si `keyword` apparaît dans `text` à une petite faute de frappe près
 * — à utiliser UNIQUEMENT en repli, quand containsWholeWord() n'a rien
 * trouvé exactement (ne remplace jamais la correspondance exacte, qui
 * reste prioritaire partout où elle est déjà utilisée).
 *
 * Compare chaque mot de `keyword` (plusieurs pour une expression comme
 * "agence web") à chaque mot de `text`, mot entier par mot entier, en
 * tolérant une distance de Levenshtein croissant avec la longueur du mot —
 * jamais sur les mots de moins de 5 lettres, pour éviter les faux positifs
 * sur des mots courts et fréquents.
 */
export function fuzzyContainsWord(text: string, keyword: string): boolean {
  if (containsWholeWord(text, keyword)) return true;
  const keywordWords = words(keyword);
  const textWords = words(text);
  if (keywordWords.length === 0 || textWords.length === 0) return false;
  return keywordWords.every(kw => {
    if (kw.length < 5) return textWords.includes(kw);
    const tolerance = toleranceFor(kw.length);
    return textWords.some(tw =>
      Math.abs(tw.length - kw.length) <= tolerance && levenshteinDistance(tw, kw) <= tolerance
    );
  });
}
