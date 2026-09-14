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

/** Marque une fiche comme migrée vers la base (table de suivi, étape 4). */
export async function dbMarkMigrated(proId: string): Promise<void> {
  if (!isDbConfigured) return;
  await sql`
    INSERT INTO migration_status (pro_id, migrated_at)
    VALUES (${proId}, now())
    ON CONFLICT (pro_id) DO UPDATE SET migrated_at = now()
  `;
}

/** Nombre de fiches migrées vs total en base (diagnostic pour l'admin). */
export async function dbGetMigrationSummary(): Promise<{ migrated: number; total: number }> {
  if (!isDbConfigured) return { migrated: 0, total: 0 };
  const { rows: migratedRows } = await sql`SELECT COUNT(*)::int AS count FROM migration_status`;
  const { rows: totalRows } = await sql`SELECT COUNT(*)::int AS count FROM professionals`;
  return { migrated: migratedRows[0]?.count || 0, total: totalRows[0]?.count || 0 };
}
