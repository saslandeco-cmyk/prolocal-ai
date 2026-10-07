import { sql, isDbConfigured } from "./client";

/** Couche d'accès aux données — table `contact_recharges` (packs "Mises en contact" achetés). */

export interface ContactRecharge {
  id: string;
  proId: string;
  quantity: number;
  createdAt: string;
}

export async function dbAddContactRecharge(proId: string, quantity: number): Promise<void> {
  if (!isDbConfigured) return;
  const id = `recharge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await sql`
    INSERT INTO contact_recharges (id, pro_id, quantity, created_at)
    VALUES (${id}, ${proId}, ${quantity}, now())
  `;
}

/** Total de mises en contact achetées (toutes recharges confondues, hors base gratuite de la formule). */
export async function dbGetTotalContactCredits(proId: string): Promise<number> {
  if (!isDbConfigured) return 0;
  const { rows } = await sql`
    SELECT COALESCE(SUM(quantity), 0)::int AS total FROM contact_recharges WHERE pro_id = ${proId}
  `;
  return rows[0]?.total ?? 0;
}

/** Historique des recharges, les plus anciennes en premier — utilisé pour le détail affiché au professionnel. */
export async function dbGetContactRecharges(proId: string): Promise<ContactRecharge[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT id, pro_id, quantity, created_at FROM contact_recharges
    WHERE pro_id = ${proId} ORDER BY created_at ASC
  `;
  return rows.map(r => ({
    id: r.id,
    proId: r.pro_id,
    quantity: r.quantity,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}
