import { supabase } from '../../lib/supabase';

export async function POST({ request }) {
  try {
    let category = '';
    let voted_for = '';

    // 1. Lire les données brutes (ça ne crashe jamais, contrairement à .formData())
    const rawText = await request.text();
    
    // 2. Décoder les données (Formulaire classique x-www-form-urlencoded)
    if (rawText) {
      const params = new URLSearchParams(rawText);
      category = params.get('category');
      voted_for = params.get('voted_for');
    }

    // 3. Vérification des champs
    if (!category || !voted_for) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/?error=champs_manquants' }
      });
    }

    // 4. Envoi sécurisé à Supabase
    const { error } = await supabase
      .from('votes')
      .insert([
        { 
          category: category.toString().trim(), 
          voted_for: voted_for.toString().trim() 
        }
      ]);

    // S'il y a une erreur Supabase (ex: RLS bloqué), on la renvoie dans l'URL
    if (error) {
      const dbError = encodeURIComponent(error.message);
      return new Response(null, {
        status: 302,
        headers: { Location: `/?error=bdd_${dbError}` }
      });
    }

    // 5. SUCCÈS TOTAL : Redirection vers l'accueil avec le message de succès !
    return new Response(null, {
      status: 302,
      headers: { Location: '/?success=1' }
    });

  } catch (err) {
    // 6. ANTI-CRASH 500 : Si le code plante, on capture l'erreur et on la met dans l'URL
    console.error("Crash critique API Vote:", err);
    const errorMessage = encodeURIComponent(err.message || 'erreur_inconnue');
    
    return new Response(null, {
      status: 302,
      headers: { Location: `/?error=crash_${errorMessage}` }
    });
  }
}
