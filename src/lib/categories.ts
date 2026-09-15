import { CATEGORIES, SUBCATEGORIES } from "@/types";
import { CATEGORY_META } from "@/lib/categoryData";
import { CATEGORY_SLUGS, slugify } from "@/lib/profileUrl";

/**
 * Modèle "catégorie/sous-catégorie" géré depuis l'admin (voir
 * src/lib/db/categories.ts pour la couche base de données). Ce fichier ne
 * dépend d'aucun module serveur — importable côté client comme serveur.
 */

export interface SubcategoryRecord {
  id: string;
  categoryId: string;
  slug: string;
  label: string;
  order: number;
}

export interface CategoryRecord {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  order: number;
  seoTitle: string;
  subtitle: string;
  seoText: string[];
  ctaText: string;
  subcategories: SubcategoryRecord[];
}

/**
 * Tri alphabétique croissant, sensible aux règles de collation françaises
 * (accents/casse ignorés pour l'ordre). Utilisé partout où des catégories
 * ou sous-catégories sont listées — calculé à la lecture plutôt que stocké,
 * pour que tout ajout s'insère automatiquement à sa place dans le
 * classement existant, sans logique de tri supplémentaire à maintenir.
 */
export function compareLabelsFr(a: string, b: string): number {
  return a.localeCompare(b, "fr", { sensitivity: "base" });
}

/**
 * Catalogue par défaut, dérivé des constantes historiques codées en dur
 * (CATEGORIES/SUBCATEGORIES, CATEGORY_META, CATEGORY_SLUGS) — sert de repli
 * tant que la base n'est pas configurée ou que la table est vide, et de
 * données d'amorçage (seed) une fois la base disponible. Aucune duplication
 * de contenu : c'est un simple mapping vers la nouvelle forme, trié par
 * ordre alphabétique.
 */
export const DEFAULT_CATEGORIES: CategoryRecord[] = [...CATEGORIES].sort(compareLabelsFr).map((label, i) => {
  const meta = Object.values(CATEGORY_META).find(m => m.category === label);
  const slug = CATEGORY_SLUGS[label] || slugify(label);
  return {
    id: slug,
    slug,
    label,
    order: i,
    emoji: meta?.emoji || "🏷️",
    seoTitle: meta?.seoTitle || label,
    subtitle: meta?.subtitle || "",
    seoText: meta?.seoText || [],
    ctaText: meta?.ctaText || "",
    subcategories: [...(SUBCATEGORIES[label] || [])].sort(compareLabelsFr).map((subLabel, j) => ({
      id: `${slug}__${slugify(subLabel)}`,
      categoryId: slug,
      slug: slugify(subLabel),
      label: subLabel,
      order: j,
    })),
  };
});

/**
 * Catalogue effectif côté client : celui en base s'il existe, sinon le
 * catalogue par défaut — ne casse jamais l'affichage même hors-ligne ou si
 * la base n'est pas configurée.
 */
export async function getCategoriesAsync(): Promise<CategoryRecord[]> {
  try {
    const res = await fetch("/api/db/categories");
    const data = await res.json();
    if (Array.isArray(data.categories) && data.categories.length > 0) return data.categories;
  } catch {
    // repli silencieux ci-dessous
  }
  return DEFAULT_CATEGORIES;
}
