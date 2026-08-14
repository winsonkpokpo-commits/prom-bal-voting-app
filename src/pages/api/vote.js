import { supabase } from '../../lib/supabase';
import { slugify } from '../../lib/slugify';

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const voter_name = (body.voter_name || '').toString().trim();
    const selections = Array.isArray(body.selections) ? body.selections : [];

    if (!voter_name || selections.length === 0) {
      return json({ success: false, error: 'CHAMPS_MANQUANTS' }, 400);
    }

    const voter_slug = slugify(voter_name);
    if (!voter_slug) {
      return json({ success: false, error: 'NOM_INVALIDE' }, 400);
    }

    for (const sel of selections) {
      if (!sel.category_id || !Array.isArray(sel.participant_ids)) {
        return json({ success: false, error: 'DONNEES_INVALIDES' }, 400);
      }
    }

    const { error } = await supabase.rpc('cast_ballot', {
      p_voter_name: voter_name,
      p_voter_slug: voter_slug,
      p_selections: selections
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('VOTES_FERMES')) return json({ success: false, error: 'VOTES_FERMES' }, 403);
      if (msg.includes('VOTANT_NON_AUTORISE')) return json({ success: false, error: 'VOTANT_NON_AUTORISE' }, 403);
      if (msg.includes('DEJA_VOTE')) return json({ success: false, error: 'DEJA_VOTE' }, 409);
      if (msg.includes('NOMBRE_PARTICIPANTS_INVALIDE')) return json({ success: false, error: 'NOMBRE_PARTICIPANTS_INVALIDE' }, 400);
      console.error('Erreur cast_ballot:', error);
      return json({ success: false, error: 'ERREUR_SERVEUR' }, 500);
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error('Crash critique API Vote:', err);
    return json({ success: false, error: 'ERREUR_SERVEUR' }, 500);
  }
}
