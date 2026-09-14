import { sql, isDbConfigured } from "../db/client";
import type { SireneEtablissement } from "./client";

/**
 * Couche d'accès à la table entreprises_sirene. Le dédoublonnage est géré
 * nativement par la clé primaire SIRET (upsert via ON CONFLICT) — impossible
 * d'avoir deux lignes pour le même établissement.
 */

export interface EntrepriseRow {
  siret: string;
  siren: string;
  denomination: string | null;
  enseigne: string | null;
  codeApe: string | null;
  libelleApe: string | null;
  codeApeNaf2025: string | null;
  libelleApeNaf2025: string | null;
  estSiege: boolean;
  etatAdministratif: string;
  dateCreation: string | null;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  departement: string;
  lat: number | null;
  lng: number | null;
  trancheEffectif: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  professionalId: string | null;
  updatedAt: string;
}

function rowToEntreprise(row: any): EntrepriseRow {
  return {
    siret: row.siret,
    siren: row.siren,
    denomination: row.denomination,
    enseigne: row.enseigne,
    codeApe: row.code_ape,
    libelleApe: row.libelle_ape,
    codeApeNaf2025: row.code_ape_naf2025,
    libelleApeNaf2025: row.libelle_ape_naf2025,
    estSiege: row.est_siege,
    etatAdministratif: row.etat_administratif,
    dateCreation: row.date_creation,
    adresse: row.adresse,
    codePostal: row.code_postal,
    commune: row.commune,
    departement: row.departement,
    lat: row.lat,
    lng: row.lng,
    trancheEffectif: row.tranche_effectif,
    telephone: row.telephone,
    email: row.email,
    siteWeb: row.site_web,
    professionalId: row.professional_id,
    updatedAt: row.updated_at,
  };
}

export interface UpsertResult {
  status: "inserted" | "updated" | "unchanged";
  changes: { champ: string; ancienneValeur: string | null; nouvelleValeur: string | null }[];
}

/**
 * Upsert d'un établissement. Retourne le statut ("inserted" | "updated" |
 * "unchanged") ainsi que le détail des champs modifiés, pour alimenter
 * l'historique (entreprises_sirene_historique) avec de vraies valeurs
 * avant/après plutôt qu'un simple horodatage.
 *
 * Le dédoublonnage SIREN/SIRET est garanti par la contrainte PRIMARY KEY
 * sur `siret` : deux appels avec le même SIRET mettent systématiquement à
 * jour la même ligne, jamais de doublon possible.
 */
/** Supprime un établissement (et son historique associé) par SIRET. */
export async function deleteEntreprise(siret: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  await sql`DELETE FROM entreprises_sirene_historique WHERE siret = ${siret}`;
  const { rows } = await sql`DELETE FROM entreprises_sirene WHERE siret = ${siret} RETURNING siret`;
  return rows.length > 0;
}

/** Supprime plusieurs établissements en une fois (sélection en masse depuis l'admin). */
export async function deleteEntreprises(sirets: string[]): Promise<number> {
  if (!isDbConfigured || sirets.length === 0) return 0;
  await sql`DELETE FROM entreprises_sirene_historique WHERE siret = ANY(${sirets}::text[])`;
  const { rows } = await sql`DELETE FROM entreprises_sirene WHERE siret = ANY(${sirets}::text[]) RETURNING siret`;
  return rows.length;
}

/** Récupère une sélection précise d'établissements par leur SIRET — utilisé pour l'export CSV d'une sélection depuis l'admin. */
export async function getEntreprisesBySirets(sirets: string[]): Promise<EntrepriseRow[]> {
  if (!isDbConfigured || sirets.length === 0) return [];
  const { rows } = await sql`
    SELECT * FROM entreprises_sirene WHERE siret = ANY(${sirets}::text[]) ORDER BY commune ASC NULLS LAST, denomination ASC NULLS LAST
  `;
  return rows.map(rowToEntreprise);
}

export async function upsertEtablissement(etab: SireneEtablissement): Promise<UpsertResult> {
  if (!isDbConfigured) return { status: "unchanged", changes: [] };

  const TRACKED_FIELDS: [string, string, string | null][] = [
    ["denomination", "denomination", etab.denomination],
    ["code_ape", "codeApe", etab.codeApe],
    ["etat_administratif", "etatAdministratif", etab.etatAdministratif],
    ["adresse", "adresse", etab.adresse],
    ["code_postal", "codePostal", etab.codePostal],
    ["commune", "commune", etab.commune],
    ["enseigne", "enseigne", etab.enseigne],
  ];

  const { rows: existingRows } = await sql`
    SELECT denomination, code_ape, etat_administratif, adresse, code_postal, commune, enseigne
    FROM entreprises_sirene WHERE siret = ${etab.siret}
  `;
  const existing = existingRows[0];

  const changes: UpsertResult["changes"] = [];
  if (existing) {
    for (const [dbCol, , newVal] of TRACKED_FIELDS) {
      const oldVal = existing[dbCol] ?? null;
      if ((oldVal ?? null) !== (newVal ?? null)) {
        changes.push({ champ: dbCol, ancienneValeur: oldVal, nouvelleValeur: newVal });
      }
    }
  }

  await sql`
    INSERT INTO entreprises_sirene (
      siret, siren, nic, denomination, nom_commercial, enseigne,
      code_ape, libelle_ape, code_ape_naf2025, libelle_ape_naf2025,
      est_siege, etat_administratif, date_creation,
      adresse, code_postal, commune, code_commune_insee, departement,
      tranche_effectif, lat, lng, raw_data, source, last_synced_at, updated_at
    ) VALUES (
      ${etab.siret}, ${etab.siren}, ${etab.nic}, ${etab.denomination}, ${etab.nomCommercial}, ${etab.enseigne},
      ${etab.codeApe}, ${etab.libelleApe}, ${etab.codeApeNaf2025}, ${etab.libelleApeNaf2025},
      ${etab.estSiege}, ${etab.etatAdministratif}, ${etab.dateCreation},
      ${etab.adresse}, ${etab.codePostal}, ${etab.commune}, ${etab.codeCommuneInsee}, ${(etab.codePostal || "40").slice(0, 2)},
      ${etab.trancheEffectif}, ${etab.lat}, ${etab.lng}, ${JSON.stringify(etab.raw)}::jsonb, 'recherche-entreprises', now(), now()
    )
    ON CONFLICT (siret) DO UPDATE SET
      denomination = EXCLUDED.denomination,
      nom_commercial = EXCLUDED.nom_commercial,
      enseigne = EXCLUDED.enseigne,
      code_ape = EXCLUDED.code_ape,
      libelle_ape = EXCLUDED.libelle_ape,
      code_ape_naf2025 = EXCLUDED.code_ape_naf2025,
      libelle_ape_naf2025 = EXCLUDED.libelle_ape_naf2025,
      etat_administratif = EXCLUDED.etat_administratif,
      adresse = EXCLUDED.adresse,
      code_postal = EXCLUDED.code_postal,
      commune = EXCLUDED.commune,
      code_commune_insee = EXCLUDED.code_commune_insee,
      tranche_effectif = EXCLUDED.tranche_effectif,
      -- Ne remplace les coordonnées déjà géocodées que si la nouvelle
      -- valeur en apporte une (évite d'écraser un géocodage réussi par
      -- un null si l'adresse n'a pas changé mais que le géocodage de ce
      -- cycle échoue ponctuellement).
      lat = COALESCE(EXCLUDED.lat, entreprises_sirene.lat),
      lng = COALESCE(EXCLUDED.lng, entreprises_sirene.lng),
      raw_data = EXCLUDED.raw_data,
      last_synced_at = now(),
      updated_at = now()
  `;

  if (!existing) return { status: "inserted", changes: [] };
  return { status: changes.length > 0 ? "updated" : "unchanged", changes };
}

/** Enregistre les changements détectés dans l'historique (étape 2+). */
export async function logHistorique(
  siret: string,
  changes: { champ: string; ancienneValeur: string | null; nouvelleValeur: string | null }[]
): Promise<void> {
  if (!isDbConfigured || changes.length === 0) return;
  for (const c of changes) {
    await sql`
      INSERT INTO entreprises_sirene_historique (siret, champ, ancienne_valeur, nouvelle_valeur)
      VALUES (${siret}, ${c.champ}, ${c.ancienneValeur}, ${c.nouvelleValeur})
    `;
  }
}

export async function getEntreprisesCount(): Promise<number> {
  if (!isDbConfigured) return 0;
  const { rows } = await sql`SELECT COUNT(*)::int AS count FROM entreprises_sirene`;
  return rows[0]?.count || 0;
}

export async function getEntreprisesByApe(codeApe: string, limit = 50): Promise<EntrepriseRow[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT * FROM entreprises_sirene
    WHERE code_ape = ${codeApe} AND etat_administratif = 'A'
    ORDER BY denomination ASC
    LIMIT ${limit}
  `;
  return rows.map(rowToEntreprise);
}

// ── Recherche paginée (API interne /api/entreprises) ──

export interface SearchEntreprisesParams {
  q?: string;
  codesApe?: string[];
  commune?: string;
  codePostal?: string;
  page?: number;
  perPage?: number;
}

export interface SearchEntreprisesResult {
  entreprises: EntrepriseRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function searchEntreprises(params: SearchEntreprisesParams): Promise<SearchEntreprisesResult> {
  if (!isDbConfigured) return { entreprises: [], total: 0, page: 1, totalPages: 0 };

  const page = Math.max(1, params.page || 1);
  const perPage = Math.min(500, Math.max(1, params.perPage || 25));
  const offset = (page - 1) * perPage;

  const q = params.q?.trim() || null;
  const codesApe = params.codesApe && params.codesApe.length > 0 ? params.codesApe : null;
  const commune = params.commune?.trim() || null;
  const codePostal = params.codePostal?.trim() || null;

  // Toujours limité aux établissements actifs (voir requête décrivant la
  // synchronisation, étape 2 : seuls les actifs sont conservés en base).
  const { rows: countRows } = await sql`
    SELECT COUNT(*)::int AS count FROM entreprises_sirene
    WHERE etat_administratif = 'A'
      AND (${q}::text IS NULL OR to_tsvector('french', coalesce(denomination, '') || ' ' || coalesce(enseigne, '')) @@ plainto_tsquery('french', ${q}))
      AND (${codesApe}::text[] IS NULL OR code_ape = ANY(${codesApe}::text[]))
      AND (${commune}::text IS NULL OR commune ILIKE ${commune ? `%${commune}%` : null})
      AND (${codePostal}::text IS NULL OR code_postal = ${codePostal})
  `;
  const total = countRows[0]?.count || 0;

  const { rows } = await sql`
    SELECT * FROM entreprises_sirene
    WHERE etat_administratif = 'A'
      AND (${q}::text IS NULL OR to_tsvector('french', coalesce(denomination, '') || ' ' || coalesce(enseigne, '')) @@ plainto_tsquery('french', ${q}))
      AND (${codesApe}::text[] IS NULL OR code_ape = ANY(${codesApe}::text[]))
      AND (${commune}::text IS NULL OR commune ILIKE ${commune ? `%${commune}%` : null})
      AND (${codePostal}::text IS NULL OR code_postal = ${codePostal})
    ORDER BY denomination ASC NULLS LAST
    LIMIT ${perPage} OFFSET ${offset}
  `;

  return {
    entreprises: rows.map(rowToEntreprise),
    total,
    page,
    totalPages: Math.ceil(total / perPage) || 1,
  };
}

export async function getEntrepriseBySiret(siret: string): Promise<EntrepriseRow | null> {
  if (!isDbConfigured) return null;
  const { rows } = await sql`SELECT * FROM entreprises_sirene WHERE siret = ${siret} LIMIT 1`;
  return rows.length > 0 ? rowToEntreprise(rows[0]) : null;
}

/** Établissements du même SIREN (autres établissements de la même entreprise). */
export async function getEntreprisesBySiren(siren: string): Promise<EntrepriseRow[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT * FROM entreprises_sirene WHERE siren = ${siren} ORDER BY est_siege DESC, denomination ASC
  `;
  return rows.map(rowToEntreprise);
}

/** Résumé des codes APE présents en base, avec libellé et nombre d'établissements — utile pour construire des filtres "par métier". */
export async function getApeCodesSummary(): Promise<{ codeApe: string; libelle: string | null; count: number }[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT code_ape, MAX(libelle_ape) AS libelle, COUNT(*)::int AS count
    FROM entreprises_sirene
    WHERE etat_administratif = 'A' AND code_ape IS NOT NULL
    GROUP BY code_ape
    ORDER BY count DESC
  `;
  return rows.map(r => ({ codeApe: r.code_ape, libelle: r.libelle, count: r.count }));
}

/**
 * Liste complète des établissements actifs, avec tous les champs utiles à
 * l'export CSV — utilisée par le bouton "Exporter CSV" de l'admin. Sans
 * limite de volume (contrairement à getAllEntreprisesForSitemap) : un
 * export CSV doit contenir l'intégralité de la base.
 */
export async function getAllEntreprisesForExport(): Promise<EntrepriseRow[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT * FROM entreprises_sirene
    WHERE etat_administratif = 'A'
    ORDER BY commune ASC NULLS LAST, denomination ASC NULLS LAST
  `;
  return rows.map(rowToEntreprise);
}
export async function getAllEntreprisesForSitemap(): Promise<
  { siret: string; denomination: string | null; enseigne: string | null; commune: string | null; updatedAt: string }[]
> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT siret, denomination, enseigne, commune, updated_at
    FROM entreprises_sirene
    WHERE etat_administratif = 'A'
    ORDER BY updated_at DESC
    LIMIT 5000
  `;
  return rows.map(r => ({ siret: r.siret, denomination: r.denomination, enseigne: r.enseigne, commune: r.commune, updatedAt: r.updated_at }));
}

// ── Codes APE suivis (configurables depuis l'admin, étape 4) ──

export async function getWatchedApeCodes(): Promise<{ codeApe: string; libelle: string | null }[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`SELECT code_ape, libelle FROM sirene_watched_ape_codes ORDER BY code_ape ASC`;
  return rows.map(r => ({ codeApe: r.code_ape, libelle: r.libelle }));
}

export async function addWatchedApeCode(codeApe: string, libelle?: string): Promise<void> {
  if (!isDbConfigured) return;
  await sql`
    INSERT INTO sirene_watched_ape_codes (code_ape, libelle) VALUES (${codeApe}, ${libelle || null})
    ON CONFLICT (code_ape) DO UPDATE SET libelle = EXCLUDED.libelle
  `;
}

export async function removeWatchedApeCode(codeApe: string): Promise<void> {
  if (!isDbConfigured) return;
  await sql`DELETE FROM sirene_watched_ape_codes WHERE code_ape = ${codeApe}`;
}

// ── Journal des synchronisations ──

export async function startSyncLog(codesApe: string[]): Promise<number | null> {
  if (!isDbConfigured) return null;
  const { rows } = await sql`
    INSERT INTO sirene_sync_log (codes_ape, status) VALUES (${codesApe}::text[], 'running')
    RETURNING id
  `;
  return rows[0]?.id ?? null;
}

export async function finishSyncLog(
  id: number | null,
  stats: { totalFetched: number; totalInserted: number; totalUpdated: number; totalUnchanged: number; error?: string }
): Promise<void> {
  if (!isDbConfigured || id === null) return;
  await sql`
    UPDATE sirene_sync_log SET
      finished_at = now(),
      status = ${stats.error ? "error" : "success"},
      total_fetched = ${stats.totalFetched},
      total_inserted = ${stats.totalInserted},
      total_updated = ${stats.totalUpdated},
      total_unchanged = ${stats.totalUnchanged},
      error_message = ${stats.error || null}
    WHERE id = ${id}
  `;
}

export async function getRecentSyncLogs(limit = 20) {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT * FROM sirene_sync_log ORDER BY started_at DESC LIMIT ${limit}
  `;
  return rows;
}

// ── Nettoyage de la base (historique + journal de synchronisation) ──

export interface CleanupResult {
  historiqueDeleted: number;
  syncLogsDeleted: number;
}

/**
 * Supprime les entrées d'historique et de journal de synchronisation plus
 * anciennes que `daysToKeep` jours. Ne touche jamais aux entreprises
 * elles-mêmes (table entreprises_sirene) — uniquement les traces
 * d'audit/journalisation, qui grossissent indéfiniment sans purge.
 */
export async function cleanupOldSireneData(daysToKeep: number): Promise<CleanupResult> {
  if (!isDbConfigured) return { historiqueDeleted: 0, syncLogsDeleted: 0 };

  const { rows: histRows } = await sql`
    DELETE FROM entreprises_sirene_historique
    WHERE detecte_le < now() - (${daysToKeep}::text || ' days')::interval
    RETURNING id
  `;
  const { rows: logRows } = await sql`
    DELETE FROM sirene_sync_log
    WHERE started_at < now() - (${daysToKeep}::text || ' days')::interval
    RETURNING id
  `;

  return { historiqueDeleted: histRows.length, syncLogsDeleted: logRows.length };
}

/** Nombre total de lignes d'historique et de journal actuellement en base (pour affichage admin). */
export async function getSireneAuditCounts(): Promise<{ historique: number; syncLogs: number }> {
  if (!isDbConfigured) return { historique: 0, syncLogs: 0 };
  const [{ rows: h }, { rows: l }] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM entreprises_sirene_historique`,
    sql`SELECT COUNT(*)::int AS count FROM sirene_sync_log`,
  ]);
  return { historique: h[0]?.count || 0, syncLogs: l[0]?.count || 0 };
}

// ── Enrichissement manuel (téléphone / email / site web) ──

export async function updateEnrichment(
  siret: string,
  data: { telephone?: string; email?: string; siteWeb?: string },
  source: string = "manuel"
): Promise<boolean> {
  if (!isDbConfigured) return false;
  const { rows } = await sql`
    UPDATE entreprises_sirene SET
      telephone = COALESCE(${data.telephone || null}, telephone),
      email = COALESCE(${data.email || null}, email),
      site_web = COALESCE(${data.siteWeb || null}, site_web),
      enrichi_le = now(),
      enrichi_par = ${source},
      updated_at = now()
    WHERE siret = ${siret}
    RETURNING siret
  `;
  return rows.length > 0;
}

export interface CsvImportRow {
  siret: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
}

export interface CsvImportResult {
  total: number;
  matched: number;
  notFound: number;
  notFoundSirets: string[];
}

/**
 * Import CSV manuel — met à jour uniquement les champs d'enrichissement
 * (téléphone/email/site web) des établissements déjà présents en base
 * (identifiés par SIRET). Ne crée jamais de nouvel établissement : la seule
 * source de vérité pour la création reste la synchronisation SIRENE
 * (étapes 1-2), afin de ne jamais introduire de données non officielles
 * dans le référentiel principal.
 */
export async function importEnrichmentCsv(rows: CsvImportRow[]): Promise<CsvImportResult> {
  if (!isDbConfigured) return { total: rows.length, matched: 0, notFound: 0, notFoundSirets: [] };

  let matched = 0;
  const notFoundSirets: string[] = [];

  for (const row of rows) {
    const siret = row.siret.replace(/\s/g, "");
    if (!siret) continue;
    const ok = await updateEnrichment(siret, {
      telephone: row.telephone,
      email: row.email,
      siteWeb: row.siteWeb,
    }, "import_csv");
    if (ok) matched++; else notFoundSirets.push(siret);
  }

  return { total: rows.length, matched, notFound: notFoundSirets.length, notFoundSirets: notFoundSirets.slice(0, 20) };
}
