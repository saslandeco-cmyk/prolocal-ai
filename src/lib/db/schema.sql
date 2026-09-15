-- ═══════════════════════════════════════════════════════════════════
-- Schéma de base de données — Prolocal-Landes.fr
-- Étape 1 de la migration localStorage → base de données réelle.
--
-- À exécuter une fois dans l'éditeur SQL de Vercel Postgres
-- (Vercel Dashboard → Storage → votre base → Query).
--
-- Choix de conception : chaque table combine des colonnes "en dur" pour
-- les champs utilisés dans les recherches/filtres/tris (donc indexables),
-- et une colonne `data JSONB` contenant l'objet complet (tous les champs
-- optionnels/évolutifs du type TypeScript correspondant : réseaux sociaux,
-- horaires, photos, options complémentaires, etc.). Ce choix évite une
-- table rigide à des dizaines de colonnes et une migration SQL à chaque
-- nouveau champ ajouté à l'application — la seule source de vérité pour
-- la forme exacte des données reste le type TypeScript `Professional`
-- (src/types/index.ts), toujours sérialisé tel quel dans `data`.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS professionals (
  id              TEXT PRIMARY KEY,
  siren           TEXT NOT NULL,
  siret           TEXT,
  company_name    TEXT NOT NULL,
  category        TEXT NOT NULL,
  subcategory     TEXT,
  city            TEXT NOT NULL,
  postal_code     TEXT NOT NULL,
  plan            TEXT NOT NULL DEFAULT 'standard',   -- standard | premium | gold
  status          TEXT NOT NULL DEFAULT 'active',     -- active | pending | suspended | rejected
  claimed         BOOLEAN NOT NULL DEFAULT FALSE,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  email           TEXT,
  phone           TEXT,
  data            JSONB NOT NULL,                     -- objet Professional complet
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recherche/filtre par catégorie, ville, statut (pages annuaire/catégories)
CREATE INDEX IF NOT EXISTS idx_professionals_category    ON professionals (category);
CREATE INDEX IF NOT EXISTS idx_professionals_subcategory  ON professionals (subcategory);
CREATE INDEX IF NOT EXISTS idx_professionals_city         ON professionals (city);
CREATE INDEX IF NOT EXISTS idx_professionals_status       ON professionals (status);
CREATE INDEX IF NOT EXISTS idx_professionals_siren        ON professionals (siren);
-- Recherche géographique (page "Autour de moi")
CREATE INDEX IF NOT EXISTS idx_professionals_lat_lng      ON professionals (lat, lng);
-- Recherche texte (nom d'entreprise)
CREATE INDEX IF NOT EXISTS idx_professionals_company_name ON professionals USING gin (to_tsvector('french', company_name));

CREATE TABLE IF NOT EXISTS reviews (
  id              TEXT PRIMARY KEY,
  pro_id          TEXT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'approved',   -- pending | approved | rejected
  data            JSONB NOT NULL,                     -- objet Review complet (auteur, commentaire, réponse pro, etc.)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_pro_id ON reviews (pro_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);

-- ── Table de suivi de la migration (pour la double-écriture de l'étape 2) ──
-- Permet de savoir, par professionnel, si sa fiche a déjà été migrée vers
-- la base et peut donc être lue depuis celle-ci en priorité.
CREATE TABLE IF NOT EXISTS migration_status (
  pro_id          TEXT PRIMARY KEY,
  migrated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── CRM : prospects et clients d'un professionnel (étape 5) ──
CREATE TABLE IF NOT EXISTS clients (
  id              TEXT PRIMARY KEY,
  pro_id          TEXT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  first_name      TEXT,
  last_name       TEXT,
  company         TEXT,
  email           TEXT,
  status          TEXT NOT NULL DEFAULT 'prospect',  -- prospect | actif | inactif | vip
  data            JSONB NOT NULL,                    -- objet Client complet
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_pro_id ON clients (pro_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_email  ON clients (email);

-- ── Facturation : devis, factures et avoirs d'un professionnel (étape 5) ──
CREATE TABLE IF NOT EXISTS billing_documents (
  id              TEXT PRIMARY KEY,
  pro_id          TEXT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,                     -- devis | facture | avoir
  status          TEXT NOT NULL DEFAULT 'brouillon',  -- brouillon | envoyé | accepté | refusé | payé | annulé
  number          TEXT,
  issue_date      DATE,
  data            JSONB NOT NULL,                    -- objet BillingDocument complet
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_documents_pro_id ON billing_documents (pro_id);
CREATE INDEX IF NOT EXISTS idx_billing_documents_type   ON billing_documents (type);
CREATE INDEX IF NOT EXISTS idx_billing_documents_status ON billing_documents (status);

-- ── Catalogue des options complémentaires (géré depuis l'admin) ──
-- Table facultative : si vide ou base non configurée, le site retombe sur
-- le catalogue par défaut codé en dur (src/lib/pricing.ts), pour ne jamais
-- casser le parcours de paiement.
CREATE TABLE IF NOT EXISTS complementary_options (
  id                TEXT PRIMARY KEY,        -- identifiant technique stable (ex: "pub", "seo")
  name              TEXT NOT NULL,
  description       TEXT,
  unit_amount       INTEGER NOT NULL,        -- montant en centimes d'euro
  cadence           TEXT NOT NULL,           -- "month" | "once"
  stripe_product_id TEXT NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Catégories & sous-catégories d'activité (gérées depuis l'admin) ──
-- Tables facultatives : si vides ou base non configurée, le site retombe
-- sur le catalogue par défaut codé en dur (src/lib/categories.ts), pour ne
-- jamais casser l'affichage. `id` = slug, immuable après création (garde
-- les URLs /categories/[slug] stables même si le libellé est renommé
-- ensuite — le renommage d'un libellé bascule en cascade les fiches
-- professionnelles concernées, voir dbRenameCategoryLabel).
CREATE TABLE IF NOT EXISTS categories (
  id             TEXT PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  label          TEXT NOT NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  data           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- emoji, seoTitle, subtitle, seoText[], ctaText
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id             TEXT PRIMARY KEY,
  category_id    TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug           TEXT NOT NULL,
  label          TEXT NOT NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories (category_id);

-- ═══════════════════════════════════════════════════════════════════
-- Base exhaustive des entreprises actives des Landes (données SIRENE)
-- Étape 1 : schéma + client API + synchronisation manuelle (preuve de
-- concept). Les étapes suivantes ajouteront le cron quotidien, l'API
-- interne /api/entreprises, le dashboard admin et les pages SEO.
-- ═══════════════════════════════════════════════════════════════════

-- Table principale : un établissement (SIRET) par ligne. Le dédoublonnage
-- se fait par clé primaire SIRET ; le regroupement par SIREN (établissements
-- secondaires d'une même entreprise) se fait via l'index sur la colonne siren.
CREATE TABLE IF NOT EXISTS entreprises_sirene (
  siret               TEXT PRIMARY KEY,
  siren               TEXT NOT NULL,
  nic                 TEXT NOT NULL,               -- 5 derniers chiffres du SIRET (numéro d'établissement)
  denomination        TEXT,
  nom_commercial      TEXT,
  enseigne            TEXT,

  -- Activité (code APE / NAF) — deux nomenclatures en parallèle pendant la
  -- transition NAF 2025/2027 (voir actualité INSEE de juin 2026 : les codes
  -- NAF 2025 sont déjà diffusés à titre informatif dans l'API Sirene).
  code_ape            TEXT,                        -- NAF Rév. 2 (nomenclature actuelle)
  libelle_ape          TEXT,
  code_ape_naf2025     TEXT,                        -- NAF Rév. 2025 (préparation bascule officielle)
  libelle_ape_naf2025  TEXT,

  -- Établissement
  est_siege           BOOLEAN NOT NULL DEFAULT FALSE,
  etat_administratif   TEXT NOT NULL DEFAULT 'A',    -- A = actif, C = cessé (on ne stocke que les actifs, voir sync.ts)
  date_creation        DATE,

  -- Adresse
  adresse             TEXT,
  code_postal          TEXT,
  commune              TEXT,
  code_commune_insee    TEXT,
  departement          TEXT NOT NULL DEFAULT '40',
  lat                  DOUBLE PRECISION,
  lng                  DOUBLE PRECISION,

  -- Tranche d'effectif (utile pour prioriser l'enrichissement / le démarchage)
  tranche_effectif     TEXT,

  -- Enrichissement manuel (non fourni par Sirene, à compléter via l'admin
  -- ou un connecteur tiers — voir étape "enrichissement")
  telephone            TEXT,
  email                TEXT,
  site_web             TEXT,
  enrichi_le           TIMESTAMPTZ,
  enrichi_par          TEXT,                        -- "manuel" | "import_csv" | nom du connecteur

  -- Rattachement optionnel à une fiche Prolocal-Landes déjà créée par le pro
  professional_id      TEXT REFERENCES professionals(id) ON DELETE SET NULL,

  -- Données brutes complètes retournées par l'API, pour ne rien perdre
  -- même si ce schéma n'expose pas encore tous les champs.
  raw_data             JSONB,

  source               TEXT NOT NULL DEFAULT 'recherche-entreprises',  -- API utilisée
  first_synced_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entreprises_sirene_siren       ON entreprises_sirene (siren);
CREATE INDEX IF NOT EXISTS idx_entreprises_sirene_code_ape     ON entreprises_sirene (code_ape);
CREATE INDEX IF NOT EXISTS idx_entreprises_sirene_commune      ON entreprises_sirene (commune);
CREATE INDEX IF NOT EXISTS idx_entreprises_sirene_departement  ON entreprises_sirene (departement);
CREATE INDEX IF NOT EXISTS idx_entreprises_sirene_etat         ON entreprises_sirene (etat_administratif);
CREATE INDEX IF NOT EXISTS idx_entreprises_sirene_denomination ON entreprises_sirene USING gin (to_tsvector('french', coalesce(denomination, '') || ' ' || coalesce(enseigne, '')));

-- Historique des modifications — une ligne par changement détecté à chaque
-- synchronisation (pas un simple écrasement). Alimentée à partir de l'étape 2.
CREATE TABLE IF NOT EXISTS entreprises_sirene_historique (
  id            SERIAL PRIMARY KEY,
  siret         TEXT NOT NULL,
  champ         TEXT NOT NULL,       -- nom du champ modifié (ex: "etat_administratif", "denomination")
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  detecte_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entreprises_historique_siret ON entreprises_sirene_historique (siret);

-- Journal des synchronisations (cron quotidien, étape 2) — permet de suivre
-- les exécutions depuis le dashboard admin.
CREATE TABLE IF NOT EXISTS sirene_sync_log (
  id              SERIAL PRIMARY KEY,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'running',  -- running | success | error
  codes_ape        TEXT[],
  total_fetched     INTEGER NOT NULL DEFAULT 0,
  total_inserted    INTEGER NOT NULL DEFAULT 0,
  total_updated     INTEGER NOT NULL DEFAULT 0,
  total_unchanged   INTEGER NOT NULL DEFAULT 0,
  error_message     TEXT
);

-- Codes APE suivis — configurables depuis l'admin (étape 4), consultés par
-- le cron de synchronisation (étape 2) pour savoir quoi interroger.
CREATE TABLE IF NOT EXISTS sirene_watched_ape_codes (
  code_ape      TEXT PRIMARY KEY,
  libelle       TEXT,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
