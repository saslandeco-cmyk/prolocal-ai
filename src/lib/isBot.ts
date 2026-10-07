// Détection des robots (moteurs de recherche, IA, outils d'audit, scrapers)
// afin de les exclure des statistiques de visite.
const BOT_UA_PATTERNS = [
  "bot", "spider", "crawl", "slurp", "mediapartners", "ia_archiver",
  "facebookexternalhit", "whatsapp", "telegrambot", "discordbot", "slackbot",
  "headlesschrome", "phantomjs", "puppeteer", "playwright", "selenium",
  "lighthouse", "pingdom", "uptimerobot", "bytespider",
];

export function isBotUserAgent(ua: string): boolean {
  const s = ua.toLowerCase();
  return BOT_UA_PATTERNS.some(p => s.includes(p));
}

export function isLikelyBot(): boolean {
  if (typeof navigator === "undefined") return true;
  if (navigator.webdriver) return true;
  return isBotUserAgent(navigator.userAgent || "");
}
