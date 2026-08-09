-- Activation de l'extension uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table de configuration globale (pour fermer/ouvrir les votes)
CREATE TABLE IF NOT EXISTS config (
    id SERIAL PRIMARY KEY,
    voting_closed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Insertion de la ligne de config initiale s'il n'y en a pas
INSERT INTO config (id, voting_closed) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;

-- Table des élèves (étudiants autorisés à voter)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL
);

-- Table des catégories (Roi, Reine sont souvent à part, mais voici les catégories dynamiques)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    position INTEGER DEFAULT 0
);

-- Table des votes
CREATE TABLE IF NOT EXISTS ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_slug TEXT UNIQUE NOT NULL,
    voter_name TEXT NOT NULL,
    votes JSONB NOT NULL DEFAULT '{}'::jsonb,
    king TEXT,
    queen TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de la Row Level Security (RLS)
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ballots ENABLE ROW LEVEL SECURITY;

-- Suppression des politiques existantes (pour la réentrance du script)
DROP POLICY IF EXISTS "Deny all access to anonymous users on config" ON config;
DROP POLICY IF EXISTS "Deny all access to anonymous users on students" ON students;
DROP POLICY IF EXISTS "Deny all access to anonymous users on categories" ON categories;
DROP POLICY IF EXISTS "Deny all access to anonymous users on ballots" ON ballots;

-- Création des politiques pour bloquer TOUT accès côté client (anonyme ou authentifié via le token public)
-- Seul l'accès via SUPABASE_SERVICE_ROLE_KEY (côté serveur) contournera ces politiques
CREATE POLICY "Deny all access to anonymous users on config" ON config FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on students" ON students FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on categories" ON categories FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on ballots" ON ballots FOR ALL USING (false);

-- Insertion de quelques données de test (optionnel)
-- INSERT INTO students (name) VALUES ('Jean Dupont'), ('Marie Curie'), ('Alan Turing') ON CONFLICT (name) DO NOTHING;
-- INSERT INTO categories (name, position) VALUES ('Le/La plus stylé(e)', 1), ('Meilleur duo', 2), ('Le/La plus drôle', 3) ON CONFLICT (name) DO NOTHING;
