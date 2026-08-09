import { supabase } from '../../../lib/supabase';

export const POST = async ({ request }) => {
  try {
    const { token } = await request.json();
    
    // Very basic token validation (in a real app, use JWT)
    if (token !== "admin_token_ok") {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
    }

    const { error } = await supabase.from('config').update({ voting_closed: true }).eq('id', 1);

    if (error) {
      console.error("Erreur close-votes:", error);
      return new Response(JSON.stringify({ error: "Impossible de fermer les votes" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Exception close-votes:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
};
