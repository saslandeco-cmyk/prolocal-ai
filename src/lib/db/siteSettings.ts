import { sql, isDbConfigured } from "./client";

/** Couche d'accès aux données — table `site_settings` (réglages globaux, une seule ligne). */

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
}

export const DEFAULT_MAINTENANCE_MESSAGE = "Site en cours de finalisation, veuillez nous excuser pour le dérangement.";

/**
 * Statut du mode maintenance — toujours "désactivé" si la base n'est pas
 * configurée ou en cas d'erreur réseau : un incident sur la base ne doit
 * jamais, par effet de bord, rendre le site public inaccessible.
 */
export async function dbGetMaintenanceStatus(): Promise<MaintenanceStatus> {
  if (!isDbConfigured) return { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE };
  try {
    const { rows } = await sql`SELECT maintenance_enabled, maintenance_message FROM site_settings WHERE id = true LIMIT 1`;
    if (rows.length === 0) return { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE };
    return {
      enabled: Boolean(rows[0].maintenance_enabled),
      message: rows[0].maintenance_message || DEFAULT_MAINTENANCE_MESSAGE,
    };
  } catch {
    return { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE };
  }
}

export async function dbSetMaintenanceStatus(enabled: boolean, message: string): Promise<void> {
  if (!isDbConfigured) return;
  await sql`
    INSERT INTO site_settings (id, maintenance_enabled, maintenance_message, updated_at)
    VALUES (true, ${enabled}, ${message}, now())
    ON CONFLICT (id) DO UPDATE SET
      maintenance_enabled = EXCLUDED.maintenance_enabled,
      maintenance_message = EXCLUDED.maintenance_message,
      updated_at = now()
  `;
}
