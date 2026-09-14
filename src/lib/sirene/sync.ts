import { fetchAllEtablissements } from "./client";
import { geocodeAddress } from "@/lib/geocode";
import {
  upsertEtablissement,
  logHistorique,
  getWatchedApeCodes,
  startSyncLog,
  finishSyncLog,
} from "./db";

export interface SyncStats {
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalUnchanged: number;
  totalGeocoded: number;
  codesApe: string[];
  durationMs: number;
}

/**
 * Synchronise l'intégralité des établissements actifs pour une liste de
 * codes APE dans le département 40 : pagination automatique complète,
 * dédoublonnage par upsert SIRET, et journalisation des changements réels
 * dans l'historique.
 *
 * ⚠️ Géocodage de repli : l'API "Recherche d'Entreprises" a retiré ses
 * champs latitude/longitude le 13 mai 2026 (annonce officielle
 * data.gouv.fr) — sans coordonnées, aucun marker ne peut s'afficher sur
 * une carte. Chaque établissement sans coordonnées est donc géocodé via
 * Nominatim (OpenStreetMap, gratuit, déjà utilisé pour les professionnels
 * inscrits), avec un délai d'1 seconde entre chaque appel pour respecter
 * la politique d'usage de ce service. Les coordonnées déjà connues
 * (établissement déjà géocodé lors d'un cycle précédent) ne sont jamais
 * re-géocodées inutilement.
 *
 * Utilisée à la fois par le cron quotidien (/api/cron/sync-sirene) et par
 * un déclenchement manuel depuis l'admin (étape 4).
 */
export async function runSync(codesApe?: string[]): Promise<SyncStats> {
  const start = Date.now();

  // Si aucun code n'est passé explicitement, utilise la liste suivie
  // configurée depuis l'admin (table sirene_watched_ape_codes).
  const codes = codesApe && codesApe.length > 0
    ? codesApe
    : (await getWatchedApeCodes()).map(c => c.codeApe);

  if (codes.length === 0) {
    return { totalFetched: 0, totalInserted: 0, totalUpdated: 0, totalUnchanged: 0, totalGeocoded: 0, codesApe: [], durationMs: Date.now() - start };
  }

  let logId: number | null = null;
  let inserted = 0, updated = 0, unchanged = 0, geocoded = 0;

  try {
    // Déplacé à l'intérieur du try : si l'ouverture du journal échoue
    // (ex: problème réseau ponctuel avec la base), la synchronisation
    // continue quand même plutôt que d'échouer entièrement avant même
    // d'avoir tenté d'enregistrer la moindre entreprise.
    logId = await startSyncLog(codes).catch(() => null);

    // Un appel paginé par code APE, pour rester dans des lots raisonnables
    // et pouvoir identifier facilement quel code APE pose problème en cas
    // d'erreur partielle.
    for (const code of codes) {
      const etablissements = await fetchAllEtablissements([code], "40").catch((err) => {
        console.error(`[sync] Échec de récupération pour le code APE ${code}:`, err);
        return [];
      });

      for (const etab of etablissements) {
        // Géocode uniquement si l'API n'a pas déjà fourni de coordonnées
        // (quasiment toujours le cas désormais) et qu'une adresse existe.
        if ((!etab.lat || !etab.lng) && etab.adresse && etab.commune && etab.codePostal) {
          try {
            const coords = await geocodeAddress(etab.adresse, etab.commune, etab.codePostal);
            if (coords) { etab.lat = coords.lat; etab.lng = coords.lng; geocoded++; }
          } catch {
            // Échec silencieux : l'établissement est quand même enregistré,
            // simplement sans marker jusqu'au prochain cycle de synchro.
          }
          // Respecte la limite d'1 requête/seconde de Nominatim
          await new Promise(r => setTimeout(r, 1000));
        }

        const result = await upsertEtablissement(etab).catch((err) => {
          console.error(`[sync] Échec de l'enregistrement de ${etab.siret} (${etab.denomination}):`, err);
          return null;
        });
        if (!result) continue; // un échec isolé ne bloque jamais le reste du lot
        if (result.status === "inserted") inserted++;
        else if (result.status === "updated") { updated++; await logHistorique(etab.siret, result.changes).catch(() => {}); }
        else unchanged++;
      }
    }

    const stats: SyncStats = {
      totalFetched: inserted + updated + unchanged,
      totalInserted: inserted,
      totalUpdated: updated,
      totalUnchanged: unchanged,
      totalGeocoded: geocoded,
      codesApe: codes,
      durationMs: Date.now() - start,
    };

    await finishSyncLog(logId, {
      totalFetched: stats.totalFetched,
      totalInserted: inserted,
      totalUpdated: updated,
      totalUnchanged: unchanged,
    });

    return stats;
  } catch (err: any) {
    await finishSyncLog(logId, {
      totalFetched: inserted + updated + unchanged,
      totalInserted: inserted,
      totalUpdated: updated,
      totalUnchanged: unchanged,
      error: err.message || "Erreur inconnue lors de la synchronisation.",
    });
    throw err;
  }
}
