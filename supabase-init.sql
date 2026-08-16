-- ============================================================
-- Bal Masqué 2026 - CPEG Ste Bakhita
-- Script d'initialisation Supabase — reflète le schéma réellement
-- utilisé par le code de l'application. Sûr à ré-exécuter.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- 1. Configuration globale (ouverture/fermeture du scrutin) ----------
CREATE TABLE IF NOT EXISTS config (
    id SERIAL PRIMARY KEY,
    voting_closed BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO config (id, voting_closed) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;

-- ---------- 2. Participants (liste commune à toutes les catégories) ----------
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 3. Catégories de vote (avec nombre de participants requis) ----------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    position INTEGER DEFAULT 0,
    slots INTEGER NOT NULL DEFAULT 1
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slots_check') THEN
    ALTER TABLE categories ADD CONSTRAINT categories_slots_check CHECK (slots >= 1 AND slots <= 5);
  END IF;
END $$;

-- ---------- 4. Électeurs autorisés (whitelist) ----------
CREATE TABLE IF NOT EXISTS eligible_voters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 5. Votes (une ligne par participant choisi ; participant_id NULL = vote blanc) ----------
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    voter_name TEXT NOT NULL,
    voter_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS votes_category_id_idx ON votes(category_id);
CREATE INDEX IF NOT EXISTS votes_participant_id_idx ON votes(participant_id);
CREATE INDEX IF NOT EXISTS votes_voter_slug_idx ON votes(voter_slug);

-- ---------- 6. Reçus de vote : garantit un seul vote par personne et par catégorie ----------
CREATE TABLE IF NOT EXISTS vote_receipts (
    voter_slug TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (voter_slug, category_id)
);

-- ---------- 7. Row Level Security : tout accès client est bloqué ----------
-- Seule SUPABASE_SERVICE_ROLE_KEY (utilisée exclusivement côté serveur) contourne RLS.
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligible_voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access to anonymous users on config" ON config;
DROP POLICY IF EXISTS "Deny all access to anonymous users on participants" ON participants;
DROP POLICY IF EXISTS "Deny all access to anonymous users on categories" ON categories;
DROP POLICY IF EXISTS "Deny all access to anonymous users on votes" ON votes;
DROP POLICY IF EXISTS "Deny all access to anonymous users on eligible_voters" ON eligible_voters;
DROP POLICY IF EXISTS "Deny all access to anonymous users on vote_receipts" ON vote_receipts;

CREATE POLICY "Deny all access to anonymous users on config" ON config FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on participants" ON participants FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on categories" ON categories FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on votes" ON votes FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on eligible_voters" ON eligible_voters FOR ALL USING (false);
CREATE POLICY "Deny all access to anonymous users on vote_receipts" ON vote_receipts FOR ALL USING (false);

-- ---------- 8. Fonction atomique de soumission d'un bulletin complet ----------
CREATE OR REPLACE FUNCTION cast_ballot(
  p_voter_name TEXT,
  p_voter_slug TEXT,
  p_selections JSONB -- [{"category_id": "uuid", "participant_ids": ["uuid", ...]}, ...]
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_closed BOOLEAN;
  v_item JSONB;
  v_category_id UUID;
  v_participant_ids UUID[];
  v_slots INTEGER;
  v_pid UUID;
BEGIN
  SELECT voting_closed INTO v_closed FROM config WHERE id = 1;
  IF v_closed THEN
    RAISE EXCEPTION 'VOTES_FERMES';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM eligible_voters WHERE slug = p_voter_slug) THEN
    RAISE EXCEPTION 'VOTANT_NON_AUTORISE';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_selections)
  LOOP
    v_category_id := (v_item->>'category_id')::UUID;
    SELECT ARRAY(SELECT jsonb_array_elements_text(v_item->'participant_ids'))::UUID[] INTO v_participant_ids;

    SELECT slots INTO v_slots FROM categories WHERE id = v_category_id;
    IF v_slots IS NULL THEN
      RAISE EXCEPTION 'CATEGORIE_INTROUVABLE';
    END IF;

    IF array_length(v_participant_ids, 1) IS NOT NULL AND array_length(v_participant_ids, 1) <> v_slots THEN
      RAISE EXCEPTION 'NOMBRE_PARTICIPANTS_INVALIDE';
    END IF;

    -- Réclame le reçu : échoue automatiquement si déjà voté (clé primaire)
    INSERT INTO vote_receipts (voter_slug, category_id) VALUES (p_voter_slug, v_category_id);

    IF array_length(v_participant_ids, 1) IS NULL THEN
      INSERT INTO votes (category_id, participant_id, voter_name, voter_slug)
      VALUES (v_category_id, NULL, p_voter_name, p_voter_slug);
    ELSE
      FOREACH v_pid IN ARRAY v_participant_ids LOOP
        INSERT INTO votes (category_id, participant_id, voter_name, voter_slug)
        VALUES (v_category_id, v_pid, p_voter_name, p_voter_slug);
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'DEJA_VOTE';
END;
$$;

-- ---------- 9. Bucket de stockage public pour les photos des participants ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidates', 'candidates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ---------- 10. (Optionnel) Nettoyage de l'ancien schéma V1 ----------
-- "students" et "ballots" appartenaient à la toute première version du schéma
-- et ne sont plus utilisés nulle part dans le code actuel.
-- Décommente si elles existent encore sur ton projet et que tu veux les supprimer :
-- DROP TABLE IF EXISTS ballots CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
