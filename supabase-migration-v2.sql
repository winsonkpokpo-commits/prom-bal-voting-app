-- Migration v2 : photos + couples
-- À exécuter dans Supabase > SQL Editor, APRÈS supabase-init.sql
-- Sans danger de réexécuter (idempotent)

-- Photo de profil (utilisée pour le vote et les résultats)
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Statut de présence (utile plus tard pour distinguer "inscrit" de "confirmé au bal")
ALTER TABLE students ADD COLUMN IF NOT EXISTS attending BOOLEAN NOT NULL DEFAULT TRUE;

-- Table des couples (prête pour une future catégorie "couple le plus drôle", etc.)
CREATE TABLE IF NOT EXISTS couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_a_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_b_id UUID REFERENCES students(id) ON DELETE CASCADE,
    photo_url TEXT,
    label TEXT
);

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all access to anonymous users on couples" ON couples;
CREATE POLICY "Deny all access to anonymous users on couples" ON couples FOR ALL USING (false);

-- ============================================
-- ÉTAPE MANUELLE (hors SQL, à faire une seule fois) :
-- Supabase > Storage > "New bucket" > nom exact : photos
-- Cochez "Public bucket" (nécessaire pour que les photos s'affichent sur le site).
-- Aucune policy supplémentaire à créer : les écritures passent toujours par la
-- clé SUPABASE_SERVICE_ROLE_KEY côté serveur, qui contourne la RLS/Storage,
-- exactement comme pour vos autres tables.
-- ============================================
