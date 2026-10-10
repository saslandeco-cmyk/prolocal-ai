/**
 * Limiteur de débit léger, en mémoire — sans dépendance externe ni base de
 * données, pensé pour freiner les scripts de spam basiques sur les
 * formulaires publics (contact, inscription). Protection volontairement
 * "légère" (voir la discussion qui a précédé son ajout) : pas pensée pour
 * résister à une attaque distribuée sophistiquée, seulement à décourager
 * l'abus le plus courant (un même visiteur qui soumet en boucle).
 *
 * ⚠️ L'état vit en mémoire du processus : sur Vercel (serverless), chaque
 * instance a son propre compteur, remis à zéro à chaque redémarrage à froid
 * — c'est un filtre de bon sens, pas une garantie absolue.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Vrai si `key` (généralement `${route}:${ip}`) a dépassé `max` tentatives
 * au cours des `windowMs` dernières millisecondes. Incrémente le compteur à
 * chaque appel, qu'il soit autorisé ou non.
 */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

/** Adresse IP du visiteur à partir des en-têtes de proxy standard (Vercel). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
