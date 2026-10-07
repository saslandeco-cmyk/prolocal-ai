import { sql, isDbConfigured } from "./client";
import type { Demande, DemandeStatus } from "@/types/needs";

/** Couche d'accès aux données — table `demandes` (demandes de devis/contact issues de PROLOCAL AI). */

function rowToDemande(row: any): Demande {
  const data = row.data as Demande;
  // `canal` a été ajouté après coup : les demandes créées avant n'en ont pas
  // dans leur JSONB `data`, alors que la colonne SQL en a un par défaut.
  return data.canal ? data : { ...data, canal: "prolocal_ai" };
}

export async function dbCreateDemande(demande: Demande): Promise<void> {
  if (!isDbConfigured) return;
  await sql`
    INSERT INTO demandes (id, pro_id, categorie, commune, status, canal, data, created_at, updated_at)
    VALUES (${demande.id}, ${demande.professionalId}, ${demande.categorie}, ${demande.commune}, ${demande.status}, ${demande.canal}, ${JSON.stringify(demande)}::jsonb, now(), now())
  `;
}

export async function dbGetDemandesByPro(proId: string): Promise<Demande[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`SELECT data FROM demandes WHERE pro_id = ${proId} ORDER BY created_at DESC`;
  return rows.map(rowToDemande);
}

/** Nombre total de demandes (tous canaux, tout l'historique) reçues par un pro — base du solde de mises en contact. */
export async function dbCountDemandesTotal(proId: string): Promise<number> {
  if (!isDbConfigured) return 0;
  const { rows } = await sql`SELECT count(*)::int AS count FROM demandes WHERE pro_id = ${proId}`;
  return rows[0]?.count ?? 0;
}

export async function dbGetDemandeById(id: string): Promise<Demande | null> {
  if (!isDbConfigured) return null;
  const { rows } = await sql`SELECT data FROM demandes WHERE id = ${id} LIMIT 1`;
  return rows.length > 0 ? rowToDemande(rows[0]) : null;
}

export async function dbUpdateDemandeStatus(id: string, status: DemandeStatus, reponsePro?: string): Promise<void> {
  if (!isDbConfigured) return;
  const existing = await dbGetDemandeById(id);
  if (!existing) return;
  const updated: Demande = {
    ...existing,
    status,
    reponsePro: reponsePro ?? existing.reponsePro,
    updatedAt: new Date().toISOString(),
  };
  await sql`
    UPDATE demandes SET status = ${status}, data = ${JSON.stringify(updated)}::jsonb, updated_at = now()
    WHERE id = ${id}
  `;
}
