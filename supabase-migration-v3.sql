-- supabase-migration-v3.sql (version finale)
-- Système "candidates" + votes texte libre avec anti-doublon
-- Idempotent : sans danger de le rejouer, même si tu as déjà exécuté une version précédente

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    voted_for TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colonnes anti-doublon (sans danger si votes existe déjà sans elles)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_name TEXT NOT NULL DEFAULT '';
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_slug TEXT NOT NULL DEFAULT '';

-- Un seul vote par personne (nom normalisé) et par catégorie
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_category_voter_unique'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_category_voter_unique UNIQUE (category, voter_slug);
  END IF;
END $$;

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access to anonymous users on candidates" ON candidates;
DROP POLICY IF EXISTS "Deny all access to anonymous users on votes" ON votes;

CREATE POLICY "Deny all access to anonymous users on candidates" ON candidates FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on votes" ON votes FOR ALL USING (false);

-- ÉTAPE MANUELLE : Supabase > Storage > "New bucket" > nom exact : candidates (Public bucket)
