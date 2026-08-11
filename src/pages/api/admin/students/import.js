import { requireAdmin } from '../../../../lib/admin-auth';
import { supabase } from '../../../../lib/supabase';

const MAX_ROWS = 1000;
const MAX_NAME_LENGTH = 200;

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const auth = requireAdmin(request, body.token);
    if (!auth.ok) return auth.response;

    const incoming = Array.isArray(body.students) ? body.students : [];

    if (incoming.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun élève à importer' }), { status: 400 });
    }

    if (incoming.length > MAX_ROWS) {
      return new Response(
        JSON.stringify({ error: `Fichier trop volumineux (maximum ${MAX_ROWS} lignes)` }),
        { status: 400 }
      );
    }

    // Nettoyage : noms non vides, longueur raisonnable, sans doublons dans le fichier lui-même
    const seen = new Set();
    const rows = [];
    for (const entry of incoming) {
      const rawName = typeof entry === 'string' ? entry : entry?.name;
      const name = (rawName || '').toString().trim();
      if (!name || name.length > MAX_NAME_LENGTH) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ name });
    }

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun nom valide trouvé dans le fichier' }), { status: 400 });
    }

    // upsert : ignore silencieusement les noms déjà présents en base
    // (repose sur la contrainte UNIQUE(name) déjà définie dans supabase-init.sql)
    const { data, error } = await supabase
      .from('students')
      .upsert(rows, { onConflict: 'name', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error('Erreur import students:', error);
      return new Response(JSON.stringify({ error: "Impossible d'importer la liste" }), { status: 500 });
    }

    const importedCount = data?.length || 0;

    return new Response(
      JSON.stringify({ success: true, imported: importedCount, skipped: rows.length - importedCount }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Exception import students:', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
};
