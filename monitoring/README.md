# Monitoring de la consommation Neon

Pipeline : **Neon (API de consommation) → Python (GitHub Actions, horaire) →
PostgreSQL (même base que le site) → Grafana Cloud**, avec historique,
coût estimé et alerte email en cas de dépassement de seuil.

## Vue d'ensemble

```
GitHub Actions (cron horaire)
  → monitoring/collect_neon_usage.py
      → API Neon : /consumption_history/v2/projects
      → calcule un coût estimé (tarifs publics Neon)
      → écrit dans la table neon_usage_history (Postgres)
      → si coût du mois > seuil : email via Resend
  → Grafana Cloud (datasource Postgres) lit neon_usage_history pour les tableaux de bord
```

Le script est idempotent (upsert par période) : relancer manuellement
(`workflow_dispatch`) ou en cas d'échec ponctuel ne crée jamais de doublon.

## 1. Créer une clé API Neon

1. [console.neon.tech](https://console.neon.tech) → votre projet → **Settings
   → API keys** → *Generate new API key*. Copiez la valeur (affichée une
   seule fois).
2. Notez l'**ID du projet** (visible dans Settings → General, ou dans l'URL
   de la console : `console.neon.tech/app/projects/<project_id>`).
3. `NEON_ORG_ID` est optionnel — le script le déduit automatiquement du
   projet. Si l'appel échoue (compte structuré différemment), récupérez-le
   dans l'URL de la console : `console.neon.tech/app/orgs/<org_id>`.

> Si votre base Postgres a été créée via l'intégration native Vercel
> (Storage → Postgres), un projet Neon existe bien en arrière-plan : le
> bouton **"Open in Neon Console"** de l'onglet Storage de Vercel y donne
> accès pour générer la clé API.

## 2. Configurer les secrets GitHub Actions

Dans le repo GitHub → **Settings → Secrets and variables → Actions**,
ajoutez :

| Secret | Obligatoire | Description |
|---|---|---|
| `NEON_API_KEY` | ✅ | Clé générée à l'étape 1 |
| `NEON_PROJECT_ID` | ✅ | ID du projet Neon |
| `NEON_ORG_ID` | — | Uniquement si la résolution automatique échoue |
| `POSTGRES_URL` | ✅ | Même valeur que celle utilisée par le site (Vercel → Storage → `.env.local` tab) |
| `ALERT_THRESHOLD_USD` | — | Seuil mensuel en dollars déclenchant l'alerte (ex: `15`). Sans cette variable, l'alerte est désactivée. |
| `ALERT_RECIPIENT_EMAIL` | — | Adresse qui reçoit l'alerte (requis si `ALERT_THRESHOLD_USD` est défini) |
| `RESEND_API_KEY` | — | Même clé Resend que le site, pour l'envoi réel de l'email d'alerte |

Sans `ALERT_THRESHOLD_USD`/`RESEND_API_KEY`/`ALERT_RECIPIENT_EMAIL`, la
collecte et le tableau de bord fonctionnent normalement — seule l'alerte
email est désactivée (un message l'indique dans les logs GitHub Actions).

## 3. Activer le workflow

Le workflow [`.github/workflows/neon-usage-monitor.yml`](../.github/workflows/neon-usage-monitor.yml)
tourne automatiquement toutes les heures une fois mergé sur la branche
par défaut. Pour un premier test immédiat : onglet **Actions** du repo →
*Monitoring consommation Neon* → **Run workflow**.

La table `neon_usage_history` (et `neon_usage_alerts` pour la
déduplication des emails) est créée automatiquement au premier lancement
(voir [`schema.sql`](schema.sql)) — aucune migration manuelle requise.

## 4. Connecter Grafana Cloud

1. Créez un compte sur [grafana.com](https://grafana.com/auth/sign-up) (offre
   gratuite) si ce n'est pas déjà fait.
2. Dans votre instance Grafana Cloud → **Connections → Data sources → Add
   data source → PostgreSQL**, renseignez les paramètres de connexion de
   la même base (host, port 5432, nom de la base, utilisateur, mot de
   passe — tous présents dans la chaîne `POSTGRES_URL`). Activez **TLS/SSL
   mode: require**.
3. **Dashboards → Import**, uploadez [`grafana/dashboard.json`](grafana/dashboard.json),
   puis sélectionnez la source de données PostgreSQL créée à l'étape 2
   quand Grafana le demande.
4. Le tableau de bord affiche : coût estimé du mois en cours, coût cumulé
   dans le temps, compute (CU-heures), stockage (Go), transfert réseau (Go).

### Alerte native Grafana (optionnelle, en complément de l'email automatique)

L'alerte par seuil fonctionne déjà de façon autonome via GitHub Actions +
Resend (étape 2). Si vous préférez aussi une alerte gérée depuis Grafana
(Slack, PagerDuty, email Grafana...) :

1. Panneau **"Coût estimé — mois en cours"** → *Edit* → onglet **Alert** →
   *New alert rule*.
2. Condition : `WHEN last() OF query(A) IS ABOVE <votre seuil>`.
3. **Contact points** → ajoutez un canal (email Grafana géré nativement en
   Cloud, Slack, webhook...).

## 5. Comprendre le coût estimé

Le script applique les tarifs publics Neon (plan Launch par défaut,
ajustables via `NEON_COMPUTE_RATE_USD` / `NEON_STORAGE_RATE_USD` /
`NEON_TRANSFER_RATE_USD`) :

- Compute : `$0.106` / CU-heure
- Stockage : `$0.35` / Go-mois
- Transfert réseau : `$0.10` / Go

⚠️ **C'est une estimation, pas une facture.** Elle n'intègre pas le palier
de transfert gratuit inclus par projet (500 Go/mois sur les plans
Launch/Scale), ce qui la rend volontairement un peu majorante — plus sûr
pour une alerte de budget qu'une sous-estimation. Le montant exact reste
consultable sur [console.neon.tech/app/billing](https://console.neon.tech/app/billing).

## Fichiers

| Fichier | Rôle |
|---|---|
| `collect_neon_usage.py` | Script de collecte, calcul du coût, upsert, alerte |
| `schema.sql` | Tables `neon_usage_history` / `neon_usage_alerts` (auto-appliqué) |
| `requirements.txt` | Dépendances Python (`requests`, `psycopg`) |
| `grafana/dashboard.json` | Tableau de bord Grafana prêt à importer |
| `../.github/workflows/neon-usage-monitor.yml` | Cron horaire + déclenchement manuel |
