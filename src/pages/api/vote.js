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
    let category = '';
    let voted_for = '';
    let voter_name = '';

    const rawText = await request.text();

    if (rawText) {
      const params = new URLSearchParams(rawText);
      category = params.get('category');
      voted_for = params.get('voted_for');
      voter_name = params.get('voter_name');
    }

    if (!category || !voted_for || !voter_name) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/?error=champs_manquants' }
      });
    }

    const voter_slug = slugify(voter_name);

    if (!voter_slug) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/?error=nom_invalide' }
      });
    }

    const { error } = await supabase
      .from('votes')
      .insert([
        {
          category: category.toString().trim(),
          voted_for: voted_for.toString().trim(),
          voter_name: voter_name.toString().trim(),
          voter_slug
        }
      ]);

    if (error) {
      // Violation de la contrainte unique (category, voter_slug) = déjà voté dans cette catégorie
      if (error.code === '23505') {
        return new Response(null, {
          status: 302,
          headers: { Location: '/?error=deja_vote' }
        });
      }
      const dbError = encodeURIComponent(error.message);
      return new Response(null, {
        status: 302,
        headers: { Location: `/?error=bdd_${dbError}` }
      });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: '/?success=1' }
    });

  } catch (err) {
    console.error("Crash critique API Vote:", err);
    const errorMessage = encodeURIComponent(err.message || 'erreur_inconnue');
    return new Response(null, {
      status: 302,
      headers: { Location: `/?error=crash_${errorMessage}` }
    });
  }
}
