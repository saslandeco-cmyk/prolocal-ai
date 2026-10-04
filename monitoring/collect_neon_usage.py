#!/usr/bin/env python3
"""
Collecte horaire de la consommation Neon (compute, stockage, transfert),
calcule un coût estimé, l'enregistre dans la base Postgres existante et
déclenche une alerte email si le coût cumulé du mois dépasse un seuil.

Pensé pour être exécuté par le workflow GitHub Actions
`.github/workflows/neon-usage-monitor.yml` (cron horaire + déclenchement
manuel), mais peut aussi être lancé en local pour tester :

    pip install -r monitoring/requirements.txt
    export NEON_API_KEY=...
    export NEON_PROJECT_ID=...
    export POSTGRES_URL=...
    python monitoring/collect_neon_usage.py

Variables d'environnement :
  NEON_API_KEY            (requis) Clé API Neon — console.neon.tech/app/settings/api-keys
  NEON_PROJECT_ID         (requis) Identifiant du projet Neon (ex: delicate-dawn-54854667)
  NEON_ORG_ID             (optionnel) Résolu automatiquement depuis le projet si absent
  POSTGRES_URL /
  DATABASE_URL            (requis) Chaîne de connexion Postgres (même base que le site)
  LOOKBACK_HOURS          (optionnel, défaut 6) Fenêtre re-synchronisée à chaque run
  NEON_COMPUTE_RATE_USD   (optionnel, défaut 0.106 — tarif Launch, $/CU-heure)
  NEON_STORAGE_RATE_USD   (optionnel, défaut 0.35  — tarif Launch, $/Go-mois)
  NEON_TRANSFER_RATE_USD  (optionnel, défaut 0.10  — tarif Launch, $/Go)
  ALERT_THRESHOLD_USD     (optionnel) Seuil mensuel déclenchant l'alerte email
  ALERT_RECIPIENT_EMAIL   (requis si ALERT_THRESHOLD_USD est défini)
  RESEND_API_KEY          (optionnel) Même clé que le site (Resend.com) pour l'envoi réel
  ALERT_SENDER_EMAIL      (optionnel, défaut monitoring@prolocal-landes.fr)

⚠️ Le coût estimé est une approximation basée sur les tarifs publics Neon et
sur les métriques brutes de l'API de consommation — il NE reflète PAS le
palier de transfert gratuit inclus par projet (500 Go/mois sur les plans
Launch/Scale), ce qui le rend volontairement légèrement majorant (plus sûr
pour une alerte de budget qu'une sous-estimation). Il ne remplace pas la
facture réelle consultable sur console.neon.tech/app/billing.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone

import psycopg
import requests

NEON_API_BASE = "https://console.neon.tech/api/v2"
BYTES_PER_GB = 1024 ** 3
HOURS_PER_BILLING_MONTH = 730.0  # approximation standard (365*24/12)

STORAGE_METRICS = [
    "root_branch_bytes_month",
    "child_branch_bytes_month",
    "instant_restore_bytes_month",
    "snapshot_storage_bytes_month",
]
TRANSFER_METRICS = [
    "public_network_transfer_bytes",
    "private_network_transfer_bytes",
]
ALL_METRICS = ["compute_unit_seconds"] + STORAGE_METRICS + TRANSFER_METRICS


def env(name: str, default: str | None = None, required: bool = False) -> str | None:
    val = os.environ.get(name, default)
    if required and not val:
        print(f"[erreur] Variable d'environnement manquante : {name}", file=sys.stderr)
        sys.exit(1)
    return val


def neon_headers(api_key: str) -> dict:
    return {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}


def resolve_org_id(api_key: str, project_id: str) -> str:
    org_id = os.environ.get("NEON_ORG_ID")
    if org_id:
        return org_id
    res = requests.get(f"{NEON_API_BASE}/projects/{project_id}", headers=neon_headers(api_key), timeout=30)
    res.raise_for_status()
    data = res.json()
    org_id = (data.get("project") or {}).get("org_id")
    if not org_id:
        print(
            "[erreur] Impossible de déterminer org_id automatiquement depuis le projet. "
            "Renseignez la variable d'environnement NEON_ORG_ID (visible dans l'URL de la "
            "console Neon : console.neon.tech/app/orgs/<org_id>).",
            file=sys.stderr,
        )
        sys.exit(1)
    return org_id


def fetch_consumption(api_key: str, org_id: str, project_id: str, frm: datetime, to: datetime) -> list[dict]:
    """Retourne la liste des périodes de consommation (toutes pages confondues)."""
    periods: list[dict] = []
    cursor = None
    while True:
        params = {
            "org_id": org_id,
            "project_ids": project_id,
            "from": frm.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "to": to.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "granularity": "hourly",
            "metrics": ",".join(ALL_METRICS),
            "limit": 100,
        }
        if cursor:
            params["cursor"] = cursor

        res = requests.get(
            f"{NEON_API_BASE}/consumption_history/v2/projects",
            headers=neon_headers(api_key),
            params=params,
            timeout=30,
        )
        if res.status_code == 429:
            print("[avertissement] Limite de requêtes Neon atteinte (429) — arrêt de la pagination.", file=sys.stderr)
            break
        res.raise_for_status()
        data = res.json()

        for project in data.get("projects", []):
            for period in project.get("periods", []):
                periods.extend(period.get("consumption", []))

        cursor = (data.get("pagination") or {}).get("cursor")
        if not cursor:
            break
    return periods


def aggregate_period(period: dict) -> dict:
    values = {m["metric_name"]: m["value"] for m in period.get("metrics", [])}
    compute_unit_seconds = float(values.get("compute_unit_seconds", 0))
    storage_byte_hours = float(sum(values.get(m, 0) for m in STORAGE_METRICS))
    data_transfer_bytes = float(sum(values.get(m, 0) for m in TRANSFER_METRICS))
    return {
        "timeframe_start": period["timeframe_start"],
        "timeframe_end": period["timeframe_end"],
        "compute_unit_seconds": compute_unit_seconds,
        "storage_byte_hours": storage_byte_hours,
        "data_transfer_bytes": data_transfer_bytes,
    }


def estimate_cost_usd(row: dict, rate_compute: float, rate_storage: float, rate_transfer: float) -> float:
    cu_hours = row["compute_unit_seconds"] / 3600.0
    gb_month_equiv = (row["storage_byte_hours"] / BYTES_PER_GB) / HOURS_PER_BILLING_MONTH
    gb_transfer = row["data_transfer_bytes"] / BYTES_PER_GB
    return (cu_hours * rate_compute) + (gb_month_equiv * rate_storage) + (gb_transfer * rate_transfer)


def normalize_pg_url(url: str) -> str:
    # psycopg (v3) accepte "postgres://" mais certains outils n'émettent que
    # ce schéma historique ; on le normalise par précaution.
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


def ensure_schema(conn: psycopg.Connection) -> None:
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, encoding="utf-8") as f:
        schema_sql = f.read()
    # psycopg (v3) n'exécute qu'une seule instruction par execute() — on
    # découpe donc le fichier en instructions individuelles (aucun des
    # statements de schema.sql ne contient de ";" dans une chaîne littérale).
    statements = [s.strip() for s in schema_sql.split(";") if s.strip()]
    with conn.cursor() as cur:
        for statement in statements:
            cur.execute(statement)
    conn.commit()


def upsert_periods(conn: psycopg.Connection, project_id: str, rows: list[dict]) -> None:
    with conn.cursor() as cur:
        for row in rows:
            cur.execute(
                """
                INSERT INTO neon_usage_history
                    (project_id, granularity, timeframe_start, timeframe_end,
                     compute_unit_seconds, storage_byte_hours, data_transfer_bytes, estimated_cost_usd)
                VALUES (%s, 'hourly', %s, %s, %s, %s, %s, %s)
                ON CONFLICT (project_id, granularity, timeframe_start, timeframe_end)
                DO UPDATE SET
                    compute_unit_seconds = EXCLUDED.compute_unit_seconds,
                    storage_byte_hours   = EXCLUDED.storage_byte_hours,
                    data_transfer_bytes  = EXCLUDED.data_transfer_bytes,
                    estimated_cost_usd   = EXCLUDED.estimated_cost_usd,
                    collected_at         = now()
                """,
                (
                    project_id,
                    row["timeframe_start"],
                    row["timeframe_end"],
                    row["compute_unit_seconds"],
                    row["storage_byte_hours"],
                    row["data_transfer_bytes"],
                    row["estimated_cost_usd"],
                ),
            )
    conn.commit()


def month_to_date_cost(conn: psycopg.Connection, project_id: str) -> float:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(SUM(estimated_cost_usd), 0)
            FROM neon_usage_history
            WHERE project_id = %s AND timeframe_start >= date_trunc('month', now())
            """,
            (project_id,),
        )
        return float(cur.fetchone()[0])


def maybe_send_alert(conn: psycopg.Connection, project_id: str, month_total: float) -> None:
    threshold_raw = os.environ.get("ALERT_THRESHOLD_USD")
    if not threshold_raw:
        return
    threshold = float(threshold_raw)
    if month_total <= threshold:
        return

    current_month = datetime.now(timezone.utc).date().replace(day=1)
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO neon_usage_alerts (project_id, month)
            VALUES (%s, %s)
            ON CONFLICT (project_id, month) DO NOTHING
            """,
            (project_id, current_month),
        )
        already_alerted = cur.rowcount == 0
    conn.commit()

    if already_alerted:
        print(f"[info] Seuil dépassé ({month_total:.2f} $ > {threshold:.2f} $) — alerte déjà envoyée ce mois-ci.")
        return

    print(f"[alerte] Coût estimé du mois ({month_total:.2f} $) dépasse le seuil ({threshold:.2f} $).")
    send_alert_email(project_id, month_total, threshold)


def send_alert_email(project_id: str, month_total: float, threshold: float) -> None:
    resend_key = os.environ.get("RESEND_API_KEY")
    recipient = os.environ.get("ALERT_RECIPIENT_EMAIL")
    if not resend_key or not recipient:
        print(
            "[avertissement] Seuil dépassé mais RESEND_API_KEY et/ou ALERT_RECIPIENT_EMAIL "
            "non configurés — aucun email envoyé (voir monitoring/README.md).",
            file=sys.stderr,
        )
        return

    sender = os.environ.get("ALERT_SENDER_EMAIL", "monitoring@prolocal-landes.fr")
    res = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
        json={
            "from": sender,
            "to": [recipient],
            "subject": f"⚠️ Consommation Neon au-delà du seuil ({month_total:.2f} $)",
            "text": (
                f"Le coût estimé de la base Neon (projet {project_id}) pour le mois en cours "
                f"atteint {month_total:.2f} $, au-dessus du seuil configuré de {threshold:.2f} $.\n\n"
                "Ceci est une estimation basée sur les tarifs publics Neon (voir "
                "monitoring/collect_neon_usage.py) — consultez la facturation exacte sur "
                "https://console.neon.tech/app/billing.\n\n"
                "Le tableau de bord Grafana donne le détail compute / stockage / transfert."
            ),
        },
        timeout=15,
    )
    if res.status_code >= 300:
        print(f"[erreur] Échec de l'envoi de l'email d'alerte ({res.status_code}) : {res.text}", file=sys.stderr)
    else:
        print(f"[info] Email d'alerte envoyé à {recipient}.")


def main() -> None:
    api_key = env("NEON_API_KEY", required=True)
    project_id = env("NEON_PROJECT_ID", required=True)
    pg_url = os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_URL")
    if not pg_url:
        print("[erreur] Variable d'environnement manquante : POSTGRES_URL (ou DATABASE_URL)", file=sys.stderr)
        sys.exit(1)

    lookback_hours = int(os.environ.get("LOOKBACK_HOURS", "6"))
    rate_compute = float(os.environ.get("NEON_COMPUTE_RATE_USD", "0.106"))
    rate_storage = float(os.environ.get("NEON_STORAGE_RATE_USD", "0.35"))
    rate_transfer = float(os.environ.get("NEON_TRANSFER_RATE_USD", "0.10"))

    org_id = resolve_org_id(api_key, project_id)

    to = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    frm = to - timedelta(hours=lookback_hours)

    periods = fetch_consumption(api_key, org_id, project_id, frm, to)
    rows = [aggregate_period(p) for p in periods]
    for row in rows:
        row["estimated_cost_usd"] = estimate_cost_usd(row, rate_compute, rate_storage, rate_transfer)

    with psycopg.connect(normalize_pg_url(pg_url)) as conn:
        ensure_schema(conn)

        upsert_periods(conn, project_id, rows)
        month_total = month_to_date_cost(conn, project_id)
        maybe_send_alert(conn, project_id, month_total)

    latest_cost = rows[-1]["estimated_cost_usd"] if rows else 0.0
    print(
        f"[ok] {len(rows)} période(s) synchronisée(s) pour {project_id}. "
        f"Dernier coût horaire estimé : {latest_cost:.4f} $. Total du mois : {month_total:.2f} $."
    )


if __name__ == "__main__":
    main()
