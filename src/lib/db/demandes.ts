import { sql, isDbConfigured } from "./client";
import type { Demande, DemandeStatus } from "@/types/needs";

/** Couche d'accès aux données — table `demandes` (demandes de devis/contact issues de PROLOCAL AI). */

function rowToDemande(row: any): Demande {
  return row.data as Demande;
}

export async function dbCreateDemande(demande: Demande): Promise<void> {
  if (!isDbConfigured) return;
  await sql`
    INSERT INTO demandes (id, pro_id, categorie, commune, status, data, created_at, updated_at)
    VALUES (${demande.id}, ${demande.professionalId}, ${demande.categorie}, ${demande.commune}, ${demande.status}, ${JSON.stringify(demande)}::jsonb, now(), now())
  `;
}

export async function dbGetDemandesByPro(proId: string): Promise<Demande[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`SELECT data FROM demandes WHERE pro_id = ${proId} ORDER BY created_at DESC`;
  return rows.map(rowToDemande);
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
