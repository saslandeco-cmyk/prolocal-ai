import { sql, isDbConfigured } from "./client";
import { slugify } from "@/lib/profileUrl";
import { DEFAULT_CATEGORIES, type CategoryRecord, type SubcategoryRecord } from "@/lib/categories";
import {
  dbCountProfessionalsByCategory,
  dbCountProfessionalsBySubcategory,
  dbRenameCategoryLabel,
  dbRenameSubcategoryLabel,
} from "./professionals";

/**
 * Couche d'accès aux catégories/sous-catégories — gérables (ajout /
 * modification / suppression) depuis l'admin.
 *
 * Même principe que src/lib/db/options.ts : le catalogue codé en dur
 * (DEFAULT_CATEGORIES, src/lib/categories.ts) sert de valeurs par défaut /
 * de secours si la base n'est pas configurée, ou que les tables sont vides
 * (aucune modification admin n'a encore été faite) — le site ne casse donc
 * jamais, avant même la première configuration de la base.
 */

export class CategoryInUseError extends Error {
  count: number;
  constructor(count: number) {
    super(`${count} professionnel(s) sont encore rattaché(s) à cette catégorie.`);
    this.count = count;
  }
}

interface CategoryRow {
  id: string; slug: string; label: string; display_order: number;
  data: { emoji?: string; seoTitle?: string; subtitle?: string; seoText?: string[]; ctaText?: string };
}
interface SubcategoryRow {
  id: string; category_id: string; slug: string; label: string; display_order: number;
}

function rowToCategory(row: CategoryRow, subRows: SubcategoryRow[]): CategoryRecord {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    order: row.display_order,
    emoji: row.data?.emoji || "🏷️",
    seoTitle: row.data?.seoTitle || row.label,
    subtitle: row.data?.subtitle || "",
    seoText: row.data?.seoText || [],
    ctaText: row.data?.ctaText || "",
    subcategories: subRows
      .filter(s => s.category_id === row.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map(rowToSubcategory),
  };
}

function rowToSubcategory(row: SubcategoryRow): SubcategoryRecord {
  return { id: row.id, categoryId: row.category_id, slug: row.slug, label: row.label, order: row.display_order };
}

/** Retourne le catalogue effectif : celui en base s'il existe, sinon le catalogue par défaut. */
export async function dbGetCategories(): Promise<CategoryRecord[]> {
  if (!isDbConfigured) return DEFAULT_CATEGORIES;
  try {
    const { rows: catRows } = await sql`SELECT * FROM categories ORDER BY display_order ASC`;
    if (catRows.length === 0) return DEFAULT_CATEGORIES;
    const { rows: subRows } = await sql`SELECT * FROM subcategories ORDER BY display_order ASC`;
    return (catRows as CategoryRow[])
      .sort((a, b) => a.display_order - b.display_order)
      .map(row => rowToCategory(row, subRows as SubcategoryRow[]));
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

/** Génère un slug unique (désambiguïsation -2, -3… en cas de collision). */
async function generateUniqueCategorySlug(label: string): Promise<string> {
  const base = slugify(label);
  let slug = base;
  let n = 2;
  while ((await sql`SELECT 1 FROM categories WHERE id = ${slug}`).rows.length > 0) {
    slug = `${base}-${n++}`;
  }
  return slug;
}
async function generateUniqueSubcategorySlug(categoryId: string, label: string): Promise<string> {
  const base = slugify(label);
  let slug = base;
  let n = 2;
  while ((await sql`SELECT 1 FROM subcategories WHERE category_id = ${categoryId} AND slug = ${slug}`).rows.length > 0) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export interface SaveCategoryInput {
  id?: string;
  label: string;
  emoji: string;
  order: number;
  seoTitle: string;
  subtitle: string;
  seoText: string[];
  ctaText: string;
}

/** Crée ou met à jour une catégorie. Le slug est fixé à la création et n'est plus jamais modifié. */
export async function dbSaveCategory(input: SaveCategoryInput): Promise<{ id: string }> {
  if (!isDbConfigured) throw new Error("Base de données non configurée.");
  const data = { emoji: input.emoji, seoTitle: input.seoTitle, subtitle: input.subtitle, seoText: input.seoText, ctaText: input.ctaText };

  if (input.id) {
    const { rows } = await sql`SELECT label FROM categories WHERE id = ${input.id} LIMIT 1`;
    if (rows.length === 0) throw new Error("Catégorie introuvable.");
    const oldLabel = rows[0].label as string;

    await sql`
      UPDATE categories
      SET label = ${input.label}, display_order = ${input.order}, data = ${JSON.stringify(data)}::jsonb, updated_at = now()
      WHERE id = ${input.id}
    `;
    if (oldLabel !== input.label) await dbRenameCategoryLabel(oldLabel, input.label);
    return { id: input.id };
  }

  const slug = await generateUniqueCategorySlug(input.label);
  await sql`
    INSERT INTO categories (id, slug, label, display_order, data)
    VALUES (${slug}, ${slug}, ${input.label}, ${input.order}, ${JSON.stringify(data)}::jsonb)
  `;
  return { id: slug };
}

/** Supprime une catégorie — refusé si des professionnels y sont encore rattachés. */
export async function dbDeleteCategory(id: string): Promise<void> {
  if (!isDbConfigured) return;
  const { rows } = await sql`SELECT label FROM categories WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return;
  const count = await dbCountProfessionalsByCategory(rows[0].label as string);
  if (count > 0) throw new CategoryInUseError(count);
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

export interface SaveSubcategoryInput {
  id?: string;
  categoryId: string;
  label: string;
  order: number;
}

/** Crée ou met à jour une sous-catégorie. Le slug est fixé à la création et n'est plus jamais modifié. */
export async function dbSaveSubcategory(input: SaveSubcategoryInput): Promise<{ id: string }> {
  if (!isDbConfigured) throw new Error("Base de données non configurée.");

  const { rows: catRows } = await sql`SELECT label FROM categories WHERE id = ${input.categoryId} LIMIT 1`;
  if (catRows.length === 0) throw new Error("Catégorie introuvable.");
  const categoryLabel = catRows[0].label as string;

  if (input.id) {
    const { rows } = await sql`SELECT label FROM subcategories WHERE id = ${input.id} LIMIT 1`;
    if (rows.length === 0) throw new Error("Sous-catégorie introuvable.");
    const oldLabel = rows[0].label as string;

    await sql`
      UPDATE subcategories SET label = ${input.label}, display_order = ${input.order}, updated_at = now()
      WHERE id = ${input.id}
    `;
    if (oldLabel !== input.label) await dbRenameSubcategoryLabel(categoryLabel, oldLabel, input.label);
    return { id: input.id };
  }

  const slug = await generateUniqueSubcategorySlug(input.categoryId, input.label);
  const id = `${input.categoryId}__${slug}`;
  await sql`
    INSERT INTO subcategories (id, category_id, slug, label, display_order)
    VALUES (${id}, ${input.categoryId}, ${slug}, ${input.label}, ${input.order})
  `;
  return { id };
}

/** Supprime une sous-catégorie — refusé si des professionnels y sont encore rattachés. */
export async function dbDeleteSubcategory(id: string): Promise<void> {
  if (!isDbConfigured) return;
  const { rows } = await sql`
    SELECT s.label AS sub_label, c.label AS cat_label
    FROM subcategories s JOIN categories c ON c.id = s.category_id
    WHERE s.id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return;
  const count = await dbCountProfessionalsBySubcategory(rows[0].cat_label as string, rows[0].sub_label as string);
  if (count > 0) throw new CategoryInUseError(count);
  await sql`DELETE FROM subcategories WHERE id = ${id}`;
}

/**
 * Amorce les tables avec le catalogue par défaut si elles sont vides — les
 * ids/slugs générés reprennent exactement ceux des catégories historiques
 * (CATEGORY_SLUGS), donc les URLs actuelles restent inchangées.
 */
export async function dbSeedCategoriesIfEmpty(): Promise<void> {
  if (!isDbConfigured) return;
  const { rows } = await sql`SELECT COUNT(*)::int AS count FROM categories`;
  if (rows[0]?.count > 0) return;
  for (const cat of DEFAULT_CATEGORIES) {
    const data = { emoji: cat.emoji, seoTitle: cat.seoTitle, subtitle: cat.subtitle, seoText: cat.seoText, ctaText: cat.ctaText };
    await sql`
      INSERT INTO categories (id, slug, label, display_order, data)
      VALUES (${cat.id}, ${cat.slug}, ${cat.label}, ${cat.order}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (id) DO NOTHING
    `;
    for (const sub of cat.subcategories) {
      await sql`
        INSERT INTO subcategories (id, category_id, slug, label, display_order)
        VALUES (${sub.id}, ${sub.categoryId}, ${sub.slug}, ${sub.label}, ${sub.order})
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }
}
