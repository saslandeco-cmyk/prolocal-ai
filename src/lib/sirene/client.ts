/**
 * Client pour l'API "Recherche d'Entreprises" (DINUM / data.gouv.fr).
 *
 * Choisie comme source principale plutôt que l'API Sirene officielle
 * (api.insee.fr) car :
 *  - Gratuite et sans authentification pour un usage courant (contrairement
 *    à l'API Sirene v3 qui nécessite un compte + jeton, limité à 30 req/min)
 *  - Agrège déjà les données du répertoire Sirene, mise à jour quotidienne
 *  - Recherche directe par code(s) APE + département, exactement le besoin
 *  - Limite généreuse : 7 requêtes/seconde
 *
 * Documentation : https://www.data.gouv.fr/dataservices/api-recherche-dentreprises/
 *
 * ⚠️ Nuance documentée : le paramètre `activite_principale` s'applique à
 * l'unité légale (l'entreprise), pas individuellement à chaque établissement.
 * Pour une entreprise multi-établissements dont l'activité déclarée diffère
 * entre le siège et un établissement secondaire, ce filtre reste fondé sur
 * l'activité de l'unité légale — comportement de l'API, pas une limite de
 * ce client.
 */

const BASE_URL = "https://recherche-entreprises.api.gouv.fr/search";

export interface SireneEtablissement {
  siret: string;
  siren: string;
  nic: string;
  denomination: string | null;
  nomCommercial: string | null;
  enseigne: string | null;
  codeApe: string | null;
  libelleApe: string | null;
  codeApeNaf2025: string | null;
  libelleApeNaf2025: string | null;
  estSiege: boolean;
  etatAdministratif: string; // "A" | "C"
  dateCreation: string | null;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  codeCommuneInsee: string | null;
  trancheEffectif: string | null;
  /**
   * Coordonnées GPS — ⚠️ l'API "Recherche d'Entreprises" a retiré ses
   * champs latitude/longitude le 13 mai 2026 (annonce officielle
   * data.gouv.fr). Ces champs restent lus au cas où l'API les
   * réintroduirait ou pour un autre compte/contexte, mais sont presque
   * toujours `null` en pratique désormais — voir sync.ts pour le
   * géocodage de repli (adresse → coordonnées) qui compense ce retrait.
   */
  lat: number | null;
  lng: number | null;
  raw: unknown;
}

interface SearchOptions {
  codesApe: string[];
  departement?: string; // défaut "40"
  page?: number;
  perPage?: number; // max 25 côté API
}

interface SearchResult {
  etablissements: SireneEtablissement[];
  totalResults: number;
  totalPages: number;
  page: number;
}

/**
 * Recherche les établissements actifs correspondant à un ou plusieurs
 * codes APE, filtrés sur un département (Landes = 40 par défaut).
 */
/**
 * Nettoie l'adresse brute renvoyée par l'API, qui inclut par défaut le code
 * postal et la ville à la fin (ex: "12 RUE DE LA PAIX 40100 DAX") — déjà
 * stockés séparément dans les colonnes `codePostal`/`commune`. Ne garde que
 * la partie voie/numéro, pour éviter la redondance dans la colonne adresse.
 *
 * S'ancre uniquement sur le code postal (5 chiffres, sans ambiguïté) plutôt
 * que sur le nom de la commune, dont l'orthographe/accentuation peut varier
 * entre le libellé officiel et l'adresse brute (ex: "SAINT-PAUL-LES-DAX"
 * sans accent dans l'adresse vs "Saint-Paul-lès-Dax" dans libelle_commune).
 */
function cleanAdresse(rawAdresse: string | null | undefined, codePostal: string | null | undefined): string | null {
  if (!rawAdresse) return null;
  let cleaned = rawAdresse.trim();

  if (codePostal) {
    // Coupe tout à partir du code postal (mot entier) jusqu'à la fin de la chaîne
    const idx = cleaned.search(new RegExp(`\\b${codePostal}\\b`));
    if (idx !== -1) cleaned = cleaned.slice(0, idx);
  }

  // Retire une virgule/tiret résiduel en fin de chaîne
  cleaned = cleaned.replace(/[,\-\s]+$/, "").trim();
  return cleaned || null;
}

/**
 * Récupère une URL en réessayant automatiquement sur erreur 429 (quota
 * dépassé), avec un backoff exponentiel. Respecte l'en-tête `Retry-After`
 * renvoyé par l'API quand présent, sinon double le délai à chaque tentative
 * (1s, 2s, 4s, 8s). Nécessaire car cette API n'annonce pas de limite stricte
 * mais peut renvoyer 429 en cas de pics de trafic, y compris en restant sous
 * les 7 req/s documentées (ex: plusieurs codes APE synchronisés d'affilée).
 */
async function fetchWithRetry(url: string, maxRetries = 4): Promise<Response> {
  let attempt = 0;
  for (;;) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.status !== 429 || attempt >= maxRetries) return res;

    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : NaN;
    const delayMs = Number.isFinite(retryAfterMs) && retryAfterMs > 0
      ? retryAfterMs
      : 1000 * 2 ** attempt;

    await new Promise(r => setTimeout(r, delayMs));
    attempt++;
  }
}

export async function searchEtablissements(opts: SearchOptions): Promise<SearchResult> {
  const { codesApe, departement = "40", page = 1, perPage = 25 } = opts;

  if (codesApe.length === 0) {
    throw new Error("Au moins un code APE est requis.");
  }

  const params = new URLSearchParams({
    activite_principale: codesApe.join(","),
    departement,
    etat_administratif: "A", // établissements actifs uniquement
    page: String(page),
    per_page: String(Math.min(perPage, 25)),
  });

  const res = await fetchWithRetry(`${BASE_URL}?${params.toString()}`);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API Recherche d'Entreprises — erreur ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const results: SireneEtablissement[] = [];

  for (const entreprise of data.results || []) {
    const matchingEtablissements = (entreprise.matching_etablissements || []) as any[];
    // Si l'API ne renvoie pas d'établissement "matché" précis (recherche large),
    // on retombe sur le siège de l'unité légale.
    const etabs = matchingEtablissements.length > 0
      ? matchingEtablissements
      : entreprise.siege
        ? [entreprise.siege]
        : [];

    for (const etab of etabs) {
      // Filtre de sécurité : le paramètre `departement` porte sur l'unité
      // légale globalement — on revérifie ici que CET établissement précis
      // est bien situé dans le département ciblé, pour éviter de faire
      // remonter un établissement secondaire hors Landes d'une entreprise
      // dont le siège (ou un autre établissement) est bien dans le 40.
      const cp: string | undefined = etab.code_postal || etab.adresse?.code_postal;
      if (cp && !cp.startsWith(departement)) continue;

      results.push({
        siret: etab.siret,
        siren: entreprise.siren,
        nic: etab.siret?.slice(9) || "",
        denomination: entreprise.nom_complet || entreprise.nom_raison_sociale || null,
        nomCommercial: entreprise.nom_commercial || null,
        enseigne: etab.liste_enseignes?.[0] || null,
        codeApe: entreprise.activite_principale || etab.activite_principale || null,
        libelleApe: entreprise.libelle_activite_principale || null,
        // NAF 2025 : diffusé à titre informatif par l'INSEE en préparation
        // de la bascule officielle — champs conservés en `raw` si présents,
        // exposés ici dès que l'API les stabilise sous ce nom.
        codeApeNaf2025: etab.activite_principale_naf_rev2025 || null,
        libelleApeNaf2025: etab.libelle_activite_principale_naf_rev2025 || null,
        estSiege: Boolean(etab.est_siege),
        etatAdministratif: etab.etat_administratif || "A",
        dateCreation: etab.date_creation || null,
        adresse: cleanAdresse(etab.adresse || etab.geo_adresse, cp),
        codePostal: cp || null,
        commune: etab.libelle_commune || null,
        codeCommuneInsee: etab.code_commune || null,
        trancheEffectif: etab.tranche_effectif_salarie || entreprise.tranche_effectif_salarie || null,
        // Lecture au cas où (voir note ci-dessus) — presque toujours null
        // avec cette API depuis mai 2026, le géocodage de repli dans
        // sync.ts prend le relais dans ce cas.
        lat: typeof etab.latitude === "number" ? etab.latitude : (etab.latitude ? parseFloat(etab.latitude) : null),
        lng: typeof etab.longitude === "number" ? etab.longitude : (etab.longitude ? parseFloat(etab.longitude) : null),
        raw: etab,
      });
    }
  }

  return {
    etablissements: results,
    totalResults: data.total_results ?? results.length,
    totalPages: data.total_pages ?? 1,
    page: data.page ?? page,
  };
}

/**
 * Récupère TOUS les établissements actifs pour une liste de codes APE dans
 * le département ciblé, en paginant automatiquement. À utiliser avec
 * précaution pour de très gros volumes (préférer un appel par lot de codes
 * APE si la liste est longue).
 */
export async function fetchAllEtablissements(
  codesApe: string[],
  departement = "40",
  onProgress?: (fetched: number, total: number) => void
): Promise<SireneEtablissement[]> {
  const all: SireneEtablissement[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await searchEtablissements({ codesApe, departement, page, perPage: 25 });
    all.push(...result.etablissements);
    totalPages = result.totalPages;
    onProgress?.(all.length, result.totalResults);
    page++;
    // Respecte la limite de 7 req/s de l'API (marge de sécurité)
    if (page <= totalPages) await new Promise(r => setTimeout(r, 200));
  } while (page <= totalPages && page <= 200); // garde-fou : 200 pages max (5000 résultats) par appel

  return all;
}
