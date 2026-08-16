# Bal Masqué 2026 – CPEG Ste Bakhita

Application de vote pour le Bal Masqué 2026 : gestion des participants, vote par catégorie (y compris duos), tableau de bord d'administration protégé, résultats publics révélés après clôture.

## Stack technique
- Astro 6 (SSR, `output: 'server'`)
- `@astrojs/vercel` v10 (déploiement Vercel, Node 24.x)
- Supabase (PostgreSQL + Storage), accès exclusivement via `SUPABASE_SERVICE_ROLE_KEY` côté serveur

## Fonctionnalités
- Vote par nom, vérifié contre une liste blanche d'électeurs (`eligible_voters`), insensible aux accents/majuscules
- Catégories à un ou plusieurs participants (ex: Roi/Reine = 1 personne, "Duo le plus élégant" = 2)
- Un seul vote par personne et par catégorie, garanti au niveau base de données (`vote_receipts`)
- Vote blanc possible dans chaque catégorie
- Tableau de bord admin : participants (avec photo), catégories, liste des électeurs, ouverture/fermeture du scrutin, réinitialisation des votes
- Page de résultats publique, visible uniquement après la clôture officielle du scrutin

## Installation

### 1. Cloner et installer
```bash
git clone https://github.com/winsonkpokpo-commits/prom-bal-voting-app.git
cd prom-bal-voting-app
npm install
```

### 2. Configurer Supabase
1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans l'éditeur SQL Supabase, exécute le contenu de `supabase-init.sql`.
3. Vérifie que le bucket `candidates` est bien créé et **public** (Storage → candidates → Settings).

### 3. Variables d'environnement
Copie `.env.example` vers `.env` :
