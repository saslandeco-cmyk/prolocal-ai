import type { Professional } from "@/types";
import { SUBCATEGORIES } from "@/types";
import type { CategoryRecord } from "@/lib/categories";

/** Transforme un texte en slug URL (minuscules, sans accents, tirets). */
export function slugify(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "categorie";
}

// Correspondance slug ↔ libellé de catégorie (identique à celle utilisée dans
// Navbar / /categories / le carrousel homepage, pour garder des URLs stables
// même si l'intitulé de la catégorie est légèrement modifié un jour).
export const CATEGORY_SLUGS: Record<string, string> = {
  "Alimentation & Épicerie": "alimentation",
  "Artisanat & Métiers d'art": "artisanat",
  "Bâtiment & Travaux": "batiment",
  "Beauté & Bien-être": "beaute",
  "Commerce & Vente": "commerce",
  "Culture & Élevage": "agriculture",
  "Immobilier": "immobilier",
  "Informatique & Numérique": "informatique",
  "Services à la personne": "services",
  "Sport & Fitness": "sport",
  "Transport de personnes": "transport",
};

/** Slug de catégorie : utilise la correspondance fixe, sinon génère depuis le libellé. */
export function categorySlug(category: string): string {
  return CATEGORY_SLUGS[category] || slugify(category);
}

/** Slug de sous-catégorie : généré directement depuis le libellé (pas de liste fixe). */
export function subcategorySlug(subcategory?: string): string {
  return subcategory ? slugify(subcategory) : "general";
}

/**
 * Retrouve le libellé de catégorie à partir de son slug. Si une liste de
 * catégories (issue de la base, voir src/lib/db/categories.ts) est fournie,
 * elle est consultée en priorité — pour résoudre aussi les catégories
 * créées depuis l'admin — avec repli sur la table statique historique.
 */
export function categoryLabelFromSlug(slug: string, categories?: CategoryRecord[]): string | null {
  if (categories) {
    const found = categories.find(c => c.slug === slug);
    if (found) return found.label;
  }
  const entry = Object.entries(CATEGORY_SLUGS).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

/** Reconstitue un libellé lisible depuis un slug (ex: "menuiserie-labrouche" → "Menuiserie Labrouche"). */
export function unslugify(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Construit l'URL canonique et lisible d'une fiche professionnelle :
 * /annuaire/[categorie]/[sous-categorie]/[nom-entreprise]-[id]
 *
 * L'identifiant numérique en fin de slug est la seule clé technique utilisée
 * pour retrouver la fiche — le reste de l'URL est purement décoratif/SEO et
 * peut donc être régénéré librement si le nom ou la catégorie changent, sans
 * jamais casser un lien déjà partagé ou indexé.
 */
export function buildProfileUrl(pro: Professional): string {
  const cat = categorySlug(pro.category);
  const sub = subcategorySlug(pro.subcategory);
  const name = slugify(pro.companyName) || "entreprise";
  return `/annuaire/${cat}/${sub}/${name}-${pro.id}`;
}

/**
 * Extrait l'identifiant numérique (6 chiffres) situé à la fin d'un slug de
 * fiche (ex: "menuiserie-labrouche-482913" → "482913").
 */
/**
 * Extrait l'identifiant situé à la fin d'un slug de fiche
 * (ex: "menuiserie-labrouche-482913" → "482913").
 *
 * L'URL étant toujours générée par buildProfileUrl() sous la forme
 * "nom-entreprise-[id]", l'identifiant correspond systématiquement au
 * dernier segment après le tiret final.
 */
export function extractIdFromSlug(slug: string): string | null {
  if (!slug) return null;
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  return last || null;
}

/** Slug d'une sous-catégorie, pour construire une URL (ex: "Webmaster indépendant" → "webmaster-independant"). */
export function subcategorySlugForUrl(subcategory: string): string {
  return slugify(subcategory);
}

/**
 * Retrouve le libellé exact d'une sous-catégorie à partir de son slug, au
 * sein d'une catégorie donnée. Même principe de repli que
 * categoryLabelFromSlug() ci-dessus.
 */
export function subcategoryLabelFromSlug(categoryLabel: string, slug: string, categories?: CategoryRecord[]): string | null {
  if (categories) {
    const cat = categories.find(c => c.label === categoryLabel);
    const found = cat?.subcategories.find(s => s.slug === slug);
    if (found) return found.label;
  }
  const list = SUBCATEGORIES[categoryLabel] || [];
  return list.find(s => slugify(s) === slug) || null;
}
