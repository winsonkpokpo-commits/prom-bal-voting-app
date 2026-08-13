import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

export const POST = async (context) => {
  try {
    const auth = requireAdmin(context);
    if (!auth.ok) return auth.response;

    // Supprimer tous les votes (attention, irréversible !)
    const { error } = await supabase
      .from('votes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // astuce pour supprimer toutes les lignes

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
