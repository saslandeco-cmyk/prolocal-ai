/**
 * Cookie HttpOnly attestant qu'un visiteur est l'administrateur authentifié
 * — posé par /api/admin/login (et effacé par /api/admin/logout), lu par
 * src/middleware.ts pour laisser le front office visible à l'admin même
 * quand le mode maintenance est actif pour tout le monde d'autre.
 *
 * Fichier volontairement sans dépendance runtime (ni "node:crypto", ni Web
 * Crypto) : il est importé à la fois par les routes API (runtime Node.js)
 * et par le middleware (runtime Edge), qui calculent chacun le hachage
 * SHA-256 avec l'API native de leur propre environnement, à partir de la
 * même chaîne — jamais le mot de passe en clair n'est stocké dans le cookie.
 */
export const ADMIN_AUTH_COOKIE = "prolocal_admin_auth";

/** 7 jours, aligné sur la durée de la session admin côté client (voir src/lib/storage.ts, SESSION_TTL). */
export const ADMIN_AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function adminAuthTokenInput(password: string): string {
  return `prolocal-admin-auth:${password}`;
}
