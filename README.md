# Prolocal-Landes.fr

Annuaire local des professionnels du département des Landes (40).

## Technologies

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (icônes)

## Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── annuaire/page.tsx     # Annuaire avec recherche & filtres
│   ├── inscription/page.tsx  # Formulaire d'inscription (3 étapes)
│   ├── connexion/page.tsx    # Connexion professionnels
│   ├── dashboard/page.tsx    # Tableau de bord professionnel
│   └── admin/page.tsx        # Interface administrateur
├── components/
│   ├── layout/Navbar.tsx
│   ├── layout/Footer.tsx
│   ├── ui/PlanBadge.tsx
│   ├── ui/StatusBadge.tsx
│   └── professional/ProfessionalCard.tsx
├── lib/
│   ├── storage.ts            # Gestion données (localStorage)
│   └── siren.ts              # Validation SIREN (algorithme Luhn)
└── types/index.ts            # Types TypeScript + données statiques
```

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Accès de démonstration

### Espace Professionnel (`/connexion`)
- Email : `boulangerie@example.com`
- Mot de passe : `demo123`

### Espace Administrateur
Aucun identifiant par défaut : à configurer via les variables d'environnement
`ADMIN_USERNAME` / `ADMIN_PASSWORD` (voir `.env.local.example`), vérifiées
côté serveur par `/api/admin/login`. L'URL d'accès est elle-même définie par
`ADMIN_SECRET_PATH` (voir `src/middleware.ts`) — `/admin` renvoie une erreur
404 directe.

## Fonctionnalités

### Landing page
- Hero avec recherche
- Stats, catégories, tarifs
- CTA pour les professionnels

### Annuaire (`/annuaire`)
- Recherche textuelle
- Filtres : catégorie, commune, formule
- Tri automatique : Gold > Premium > Standard

### Inscription (`/inscription`)
- **Étape 1** : Infos entreprise + vérification SIREN (algorithme Luhn)
- **Étape 2** : Coordonnées + création de compte
- **Étape 3** : Choix de la formule (Standard 10€, Premium 25€, Gold 40€)

### Dashboard professionnel (`/dashboard`)
- Statut du compte et de la fiche
- Modification des informations
- Affichage de la formule active

### Administration
- Vue d'ensemble (stats)
- Liste des professionnels avec filtres
- Validation / Refus / Suspension / Suppression des fiches
- Édition de toutes les informations

## Formules d'abonnement

| Formule  | Prix/mois | Fonctionnalités clés |
|----------|-----------|---------------------|
| Standard | 10€       | Fiche basique, 1 photo |
| Premium  | 25€       | 5 photos, horaires, site web, mise en avant |
| Gold     | 40€       | Photos illimitées, position prioritaire, stats |

## Données

Les données sont stockées dans le **localStorage** du navigateur (démo).
En production, remplacez `src/lib/storage.ts` par des appels API vers votre base de données.

## Validation SIREN

Le numéro SIREN est validé via l'**algorithme de Luhn** côté client.
En production, connectez `src/lib/siren.ts` à l'API SIRENE de l'INSEE :
`https://api.insee.fr/entreprises/sirene/V3/siret/{siren}`
