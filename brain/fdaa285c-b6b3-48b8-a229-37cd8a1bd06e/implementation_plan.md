# Application de Vote - Bal de Promo (Astro + Supabase)

Cette application permettra aux élèves de voter pour le Roi/la Reine et différentes catégories lors du bal de promo, avec un thème "Bal Masqué" très élégant.

## Arborescence du Projet Prévue

```text
prom-voting-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Layout.astro       # Layout global avec fonts et CSS de base
│   │   └── GlassCard.astro    # Composant réutilisable pour le glassmorphism
│   ├── lib/
│   │   └── supabase.js        # Initialisation du client Supabase (SSR)
│   ├── pages/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── unlock.js
│   │   │   │   ├── close-votes.js
│   │   │   │   ├── reopen-votes.js
│   │   │   │   └── reset-votes.js
│   │   │   ├── config.js
│   │   │   ├── results.js
│   │   │   └── vote.js
│   │   ├── admin/
│   │   │   ├── index.astro    # Vue Admin Configurer
│   │   │   └── results.astro  # Vue Admin Résultats
│   │   └── index.astro        # Vue Voter (Accueil)
├── .env                       # Variables d'environnement
├── astro.config.mjs           # Configuration Astro avec adaptateur Netlify
├── package.json
└── supabase-init.sql          # Script SQL pour initialiser la base de données
```

## Script SQL d'initialisation (Aperçu)

```sql
-- Création des tables
CREATE TABLE config (
    id SERIAL PRIMARY KEY,
    voting_closed BOOLEAN DEFAULT FALSE
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    position INTEGER DEFAULT 0
);

CREATE TABLE ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_slug TEXT UNIQUE NOT NULL,
    voter_name TEXT NOT NULL,
    votes JSONB NOT NULL DEFAULT '{}'::jsonb,
    king TEXT,
    queen TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialisation de la config
INSERT INTO config (id, voting_closed) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;

-- Configuration RLS (Row Level Security)
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ballots ENABLE ROW LEVEL SECURITY;

-- Seul le serveur web peut interagir avec Supabase (via service role key)
-- Les clients anonymes n'ont aucun accès direct.
CREATE POLICY "Deny all access to anonymous users on config" ON config FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on students" ON students FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on categories" ON categories FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on ballots" ON ballots FOR ALL USING (false);
```

## Étapes d'implémentation

1.  **Initialisation du projet** : Création du projet Astro `prom-voting-app`, installation des dépendances (`@astrojs/netlify`, `@supabase/supabase-js`).
2.  **Configuration Astro** : Mise en place de `astro.config.mjs` en mode `server` avec l'adaptateur Netlify.
3.  **Fichier Supabase** : Création du fichier `src/lib/supabase.js` pour initialiser le client côté serveur.
4.  **Routes API** :
    *   `/api/config` : Lecture et écriture de l'état des votes (ouvert/fermé).
    *   `/api/vote` : Enregistrement d'un vote avec validation et gestion des erreurs.
    *   `/api/results` : Récupération et agrégation des résultats.
    *   `/api/admin/*` : Routes protégées par un code pour l'administration.
5.  **Développement Frontend** :
    *   `src/components/Layout.astro` : Intégration des polices "Cinzel" et "Work Sans", et définition du CSS global (Thème Bal Masqué, Glassmorphism).
    *   `src/pages/index.astro` : Page de vote avec sélection du nom, choix Roi/Reine et catégories dynamiques.
    *   `src/pages/admin/index.astro` : Interface d'administration pour gérer les élèves, les catégories et l'état des votes.
    *   `src/pages/admin/results.astro` : Affichage des résultats (Podium et barres de progression).

## User Review Required

> [!IMPORTANT]
> Avez-vous déjà un projet Supabase créé ? Je vous fournirai le script SQL complet que vous pourrez exécuter dans l'éditeur SQL de votre dashboard Supabase.
> Pour que l'application fonctionne, il faudra définir les variables d'environnement suivantes dans un fichier `.env` ou sur Netlify :
> *   `PUBLIC_SUPABASE_URL` (Optionnel pour le client, mais utile pour SSR)
> *   `SUPABASE_URL`
> *   `SUPABASE_SERVICE_ROLE_KEY` (Très important pour le mode serveur)

Êtes-vous d'accord avec ce plan pour que je commence à générer et écrire les fichiers dans votre espace de travail ?
