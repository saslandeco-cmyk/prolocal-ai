import { dbGetCategories } from "@/lib/db/categories";

/**
 * llms.txt — convention émergente (https://llmstxt.org/) destinée aux
 * moteurs de recherche et assistants basés sur des LLM (ChatGPT, Claude,
 * Perplexity...), sur le même principe que robots.txt/sitemap.xml pour les
 * moteurs traditionnels, mais sous forme d'un résumé Markdown concis à
 * destination d'un LLM plutôt que d'un robot d'indexation classique.
 *
 * Ne remplace ni ne modifie robots.ts/sitemap.ts (SEO classique) — fichier
 * strictement additionnel, construit dynamiquement à partir des mêmes
 * catégories que le reste du site pour rester à jour automatiquement.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.prolocal-landes.fr";
  const categories = await dbGetCategories();

  const categoryLines = categories
    .map(cat => `- [${cat.label}](${baseUrl}/categories/${cat.slug}): ${cat.subtitle || `Professionnels de la catégorie ${cat.label} dans les Landes (40).`}`)
    .join("\n");

  const content = `# Prolocal-Landes

> Annuaire en ligne des professionnels, artisans, commerçants et prestataires de services du département des Landes (40), France. Recherche par catégorie, sous-catégorie et ville, avec fiches détaillées : coordonnées, horaires d'ouverture, avis clients, géolocalisation.

Prolocal-Landes référence des professionnels réels et vérifiés du département des Landes (40), chacun avec une fiche dédiée (adresse, téléphone, email, site web, horaires, avis clients vérifiés par email). Le site propose aussi une recherche en langage naturel ("PROLOCAL AI") : un visiteur décrit son besoin en une phrase et est mis en relation avec les professionnels correspondants les plus proches.

## Pages principales

- [Accueil](${baseUrl}/): présentation du site et recherche de professionnel par besoin exprimé en langage naturel
- [Annuaire complet](${baseUrl}/annuaire): liste de tous les professionnels référencés, filtrable par catégorie et ville
- [Toutes les catégories](${baseUrl}/categories): index de toutes les catégories et sous-catégories de métiers
- [Inscription professionnelle](${baseUrl}/inscription): pour qu'un professionnel des Landes référence gratuitement son entreprise

## Catégories de professionnels

${categoryLines}

## Optional

- [Nous contacter](${baseUrl}/contact)
- [Mentions légales](${baseUrl}/mentions-legales)
- [Conditions Générales d'Utilisation](${baseUrl}/cgu)
- [Protection des données personnelles](${baseUrl}/protection-donnees-personnelles)
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
