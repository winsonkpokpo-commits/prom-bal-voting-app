import { supabase } from '../../lib/supabase';

function slugify(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export async function POST({ request }) {
  try {
    const rawText = await request.text();
    const params = new URLSearchParams(rawText);

    const category_id = params.get('category_id');
    const participant_id = params.get('participant_id') || null; // vide = vote blanc
    const voter_name = params.get('voter_name');

    if (!category_id || !voter_name) {
      return new Response(null, { status: 302, headers: { Location: '/?error=champs_manquants' } });
    }

    const voter_slug = slugify(voter_name);
    if (!voter_slug) {
      return new Response(null, { status: 302, headers: { Location: '/?error=nom_invalide' } });
    }

    // Vérifie que les votes ne sont pas fermés
    const { data: configData } = await supabase
      .from('config')
      .select('voting_closed')
      .eq('id', 1)
      .single();

    if (configData?.voting_closed) {
      return new Response(null, { status: 302, headers: { Location: '/?error=votes_fermes' } });
    }

    const { error } = await supabase
      .from('votes')
      .insert([{
        category_id,
        participant_id: participant_id || null,
        voter_name: voter_name.toString().trim(),
        voter_slug
      }]);

    if (error) {
      if (error.code === '23505') {
        return new Response(null, { status: 302, headers: { Location: '/?error=deja_vote' } });
      }
      const dbError = encodeURIComponent(error.message);
      return new Response(null, { status: 302, headers: { Location: `/?error=bdd_${dbError}` } });
    }

    return new Response(null, { status: 302, headers: { Location: '/?success=1' } });

  } catch (err) {
    console.error("Crash critique API Vote:", err);
    const errorMessage = encodeURIComponent(err.message || 'erreur_inconnue');
    return new Response(null, { status: 302, headers: { Location: `/?error=crash_${errorMessage}` } });
  }
}
