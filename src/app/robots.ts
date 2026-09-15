import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prolocal-landes.fr";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // L'URL de l'espace admin n'est volontairement pas listée ici : ce
      // fichier est public, et y indiquer le chemin (même en "disallow")
      // le révélerait à quiconque le consulte — l'annuaire des robots
      // malveillants commence justement par lire robots.txt.
      disallow: ["/dashboard", "/api/", "/connexion"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
