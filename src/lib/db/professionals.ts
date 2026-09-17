import { sql, isDbConfigured } from "./client";
import type { Professional } from "@/types";

/**
 * Couche d'accès aux données — table `professionals`.
 *
 * Miroir de src/lib/storage.ts (localStorage), pensé pour être un
 * remplacement direct terme à terme lors de l'étape 3 de la migration
 * (bascule des pages publiques vers la base). Tant que cette bascule
 * n'est pas faite, ces fonctions ne sont appelées par aucune page
 * existante — elles sont prêtes, mais pas encore branchées.
 */

function rowToProfessional(row: any): Professional {
  // `data` contient l'objet Professional complet et fait foi ; les colonnes
  // "en dur" (city, plan, status...) sont dupliquées uniquement pour
  // permettre le filtrage/tri SQL, jamais utilisées comme source de vérité.
  return row.data as Professional;
}

export async function dbGetAllProfessionals(): Promise<Professional[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`SELECT data FROM professionals ORDER BY updated_at DESC`;
  return rows.map(rowToProfessional);
}

export async function dbGetProfessionalById(id: string): Promise<Professional | null> {
  if (!isDbConfigured) return null;
  const { rows } = await sql`SELECT data FROM professionals WHERE id = ${id} LIMIT 1`;
  return rows.length > 0 ? rowToProfessional(rows[0]) : null;
}

export async function dbGetProfessionalBySiren(siren: string): Promise<Professional | null> {
  if (!isDbConfigured) return null;
  const { rows } = await sql`SELECT data FROM professionals WHERE siren = ${siren} LIMIT 1`;
  return rows.length > 0 ? rowToProfessional(rows[0]) : null;
}

export async function dbGetProfessionalsByCategory(category: string): Promise<Professional[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT data FROM professionals
    WHERE category = ${category} AND status = 'active'
    ORDER BY plan = 'gold' DESC, plan = 'premium' DESC, updated_at DESC
  `;
  return rows.map(rowToProfessional);
}

/**
 * Recherche par sous-catégorie précise — utilisée par le moteur PROLOCAL AI
 * (matchProfessionals.ts) pour ne pas noyer un besoin précis (ex: "fromagerie")
 * parmi tous les professionnels de la catégorie parente (ex: toute
 * "Alimentation & Épicerie", boulangeries et boucheries comprises).
 */
export async function dbGetProfessionalsBySubcategory(category: string, subcategory: string): Promise<Professional[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT data FROM professionals
    WHERE category = ${category} AND subcategory = ${subcategory} AND status = 'active'
    ORDER BY plan = 'gold' DESC, plan = 'premium' DESC, updated_at DESC
  `;
  return rows.map(rowToProfessional);
}

/** Crée ou met à jour une fiche professionnelle (upsert par id). */
export async function dbSaveProfessional(pro: Professional): Promise<void> {
  if (!isDbConfigured) return;
  // ⚠️ Les colonnes ci-dessous sont NOT NULL en base (voir schema.sql) —
  // elles ne servent qu'à l'indexation/au filtrage, la vraie source de
  // vérité reste l'objet complet dans `data` (JSONB, sans contrainte).
  // Un repli sur une chaîne vide plutôt que de laisser passer `undefined`
  // évite un échec silencieux de l'écriture (contrainte NOT NULL violée)
  // lorsque la fiche provient d'un import CSV incomplet ou d'un ajout
  // manuel depuis l'admin sans tous les champs renseignés — l'écriture
  // aboutissait alors uniquement en localStorage (même navigateur), sans
  // jamais atteindre la base (donc invisible depuis un autre navigateur).
  await sql`
    INSERT INTO professionals (
      id, siren, siret, company_name, category, subcategory,
      city, postal_code, plan, status, claimed, lat, lng, email, phone, data, updated_at
    ) VALUES (
      ${pro.id}, ${pro.siren || ""}, ${pro.siret || null}, ${pro.companyName || ""}, ${pro.category || ""}, ${pro.subcategory || null},
      ${pro.city || ""}, ${pro.postalCode || ""}, ${pro.plan || "standard"}, ${pro.status || "active"}, ${Boolean((pro as any).claimed)},
      ${pro.lat ?? null}, ${pro.lng ?? null}, ${pro.email || null}, ${pro.phone || null},
      ${JSON.stringify(pro)}::jsonb, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      siren = EXCLUDED.siren,
      siret = EXCLUDED.siret,
      company_name = EXCLUDED.company_name,
      category = EXCLUDED.category,
      subcategory = EXCLUDED.subcategory,
      city = EXCLUDED.city,
      postal_code = EXCLUDED.postal_code,
      plan = EXCLUDED.plan,
      status = EXCLUDED.status,
      claimed = EXCLUDED.claimed,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      data = EXCLUDED.data,
      updated_at = now()
  `;
}

export async function dbDeleteProfessional(id: string): Promise<void> {
  if (!isDbConfigured) return;
  await sql`DELETE FROM professionals WHERE id = ${id}`;
}

/** Nombre de fiches rattachées à une catégorie (pour bloquer sa suppression depuis l'admin). */
export async function dbCountProfessionalsByCategory(label: string): Promise<number> {
  if (!isDbConfigured) return 0;
  const { rows } = await sql`SELECT COUNT(*)::int AS count FROM professionals WHERE category = ${label}`;
  return rows[0]?.count || 0;
}

/** Nombre de fiches rattachées à une sous-catégorie (pour bloquer sa suppression depuis l'admin). */
export async function dbCountProfessionalsBySubcategory(categoryLabel: string, subLabel: string): Promise<number> {
  if (!isDbConfigured) return 0;
  const { rows } = await sql`SELECT COUNT(*)::int AS count FROM professionals WHERE category = ${categoryLabel} AND subcategory = ${subLabel}`;
  return rows[0]?.count || 0;
}

/**
 * Bascule en cascade toutes les fiches d'une ancienne catégorie vers son
 * nouveau libellé (appelée quand l'admin renomme une catégorie) — la
 * correspondance `Professional.category === label` reste ainsi valide
 * partout dans le code sans avoir à migrer vers des identifiants.
 */
export async function dbRenameCategoryLabel(oldLabel: string, newLabel: string): Promise<void> {
  if (!isDbConfigured || oldLabel === newLabel) return;
  await sql`
    UPDATE professionals
    SET category = ${newLabel}, data = jsonb_set(data, '{category}', to_jsonb(${newLabel}::text)), updated_at = now()
    WHERE category = ${oldLabel}
  `;
}

/** Même bascule en cascade pour un renommage de sous-catégorie. */
export async function dbRenameSubcategoryLabel(categoryLabel: string, oldSub: string, newSub: string): Promise<void> {
  if (!isDbConfigured || oldSub === newSub) return;
  await sql`
    UPDATE professionals
    SET subcategory = ${newSub}, data = jsonb_set(data, '{subcategory}', to_jsonb(${newSub}::text)), updated_at = now()
    WHERE category = ${categoryLabel} AND subcategory = ${oldSub}
  `;
}

/** Marque une fiche comme migrée vers la base (table de suivi, étape 4). */
export async function dbMarkMigrated(proId: string): Promise<void> {
  if (!isDbConfigured) return;
  await sql`
    INSERT INTO migration_status (pro_id, migrated_at)
    VALUES (${proId}, now())
    ON CONFLICT (pro_id) DO UPDATE SET migrated_at = now()
  `;
}

/**
 * Liste des communes distinctes ayant au moins une fiche active — utilisée
 * par le moteur PROLOCAL AI (src/lib/ai/needParser.ts) pour détecter une
 * localisation même hors de la liste éditorialisée CITY_META (ex: communes
 * couvertes uniquement via un import SIRENE).
 */
export async function dbGetDistinctActiveCities(): Promise<string[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`SELECT DISTINCT city FROM professionals WHERE status = 'active' AND city <> ''`;
  return rows.map(r => r.city as string);
}

/** Nombre de fiches migrées vs total en base (diagnostic pour l'admin). */
export async function dbGetMigrationSummary(): Promise<{ migrated: number; total: number }> {
  if (!isDbConfigured) return { migrated: 0, total: 0 };
  const { rows: migratedRows } = await sql`SELECT COUNT(*)::int AS count FROM migration_status`;
  const { rows: totalRows } = await sql`SELECT COUNT(*)::int AS count FROM professionals`;
  return { migrated: migratedRows[0]?.count || 0, total: totalRows[0]?.count || 0 };
}
