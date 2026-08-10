import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Fournit le transport WebSocket uniquement côté serveur (Node.js)
const realtimeOptions = import.meta.env.SSR
  ? { transport: (await import('ws')).default }
  : {};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: realtimeOptions,
});
