import { supabase } from '../../../lib/supabase';

export const POST = async ({ request }) => {
  try {
    const { token } = await request.json();
    
    if (token !== "admin_token_ok") {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
    }

    // Supprimer tous les votes (attention, irréversible !)
    const { error } = await supabase.from('ballots').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // hack for deleting all

    if (error) {
      console.error("Erreur reset-votes:", error);
      return new Response(JSON.stringify({ error: "Impossible de réinitialiser les votes" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Exception reset-votes:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
};
