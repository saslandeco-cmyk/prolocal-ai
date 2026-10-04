-- Historique de consommation Neon — alimenté par monitoring/collect_neon_usage.py
--
-- Une ligne par période (granularité horaire) et par métrique agrégée.
-- La contrainte UNIQUE rend les réinsertions idempotentes (ON CONFLICT ...
-- DO UPDATE côté script) : relancer la collecte sur une fenêtre déjà
-- enregistrée met simplement à jour la valeur au lieu de dupliquer la ligne
-- — utile car l'API Neon peut renvoyer des valeurs révisées pour les
-- dernières heures avant qu'elles ne soient définitivement consolidées.
CREATE TABLE IF NOT EXISTS neon_usage_history (
  id                     BIGSERIAL PRIMARY KEY,
  project_id             TEXT NOT NULL,
  granularity            TEXT NOT NULL,
  timeframe_start        TIMESTAMPTZ NOT NULL,
  timeframe_end          TIMESTAMPTZ NOT NULL,
  compute_unit_seconds   DOUBLE PRECISION NOT NULL DEFAULT 0,
  storage_byte_hours     DOUBLE PRECISION NOT NULL DEFAULT 0,
  data_transfer_bytes    DOUBLE PRECISION NOT NULL DEFAULT 0,
  estimated_cost_usd     NUMERIC(12, 6) NOT NULL DEFAULT 0,
  collected_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, granularity, timeframe_start, timeframe_end)
);

CREATE INDEX IF NOT EXISTS neon_usage_history_timeframe_idx
  ON neon_usage_history (timeframe_start DESC);

-- Déduplication des alertes de seuil : une ligne par (projet, mois) une fois
-- l'alerte envoyée, pour ne pas réenvoyer un email à chaque exécution
-- horaire tant que le mois courant reste au-dessus du seuil.
CREATE TABLE IF NOT EXISTS neon_usage_alerts (
  project_id   TEXT NOT NULL,
  month        DATE NOT NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, month)
);
