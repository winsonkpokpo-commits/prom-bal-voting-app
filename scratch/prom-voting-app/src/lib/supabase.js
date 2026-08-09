import { createClient } from '@supabase/supabase-js';

// Utilisation des variables d'environnement côté serveur
const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ Variables d'environnement Supabase manquantes (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
}

// Initialisation du client avec la Service Role Key (nécessaire car RLS bloque tout le monde)
export const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');
