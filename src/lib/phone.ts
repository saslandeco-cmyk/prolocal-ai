/**
 * Normalise un numéro de téléphone français en 10 chiffres locaux
 * (ex: "0689384138"), quelle que soit la façon dont il a été saisi ou
 * importé — en particulier le cas classique d'un import CSV/Excel qui
 * traite une colonne de téléphone comme un nombre et supprime le 0 initial
 * (0689384138 → 689384138).
 *
 * Retourne `null` si la chaîne ne ressemble à aucun numéro français valide
 * (l'appelant décide alors s'il affiche la valeur brute ou rien).
 */
export function normalizeFrPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Préfixe international +33/0033 suivi de 9 chiffres → 0 + ces 9 chiffres
  if (digits.length === 11 && digits.startsWith("33")) {
    digits = "0" + digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith("0033")) {
    digits = "0" + digits.slice(4);
  }

  // 9 chiffres sans le 0 initial (import CSV/Excel typique) → on le restaure
  if (digits.length === 9 && digits[0] !== "0") {
    digits = "0" + digits;
  }

  return /^0[1-9]\d{8}$/.test(digits) ? digits : null;
}

/** Formate pour l'affichage humain : "06 89 38 41 38". Repli sur la valeur brute si non reconnue. */
export function formatFrPhoneDisplay(raw: string | null | undefined): string | null {
  const normalized = normalizeFrPhone(raw);
  if (!normalized) return raw?.trim() || null;
  return normalized.match(/.{2}/g)!.join(" ");
}

/** Valeur prête à l'emploi pour un lien `tel:`. Repli sur la valeur brute si non reconnue. */
export function phoneHref(raw: string | null | undefined): string {
  return `tel:${normalizeFrPhone(raw) ?? raw ?? ""}`;
}
