// src/pages/api/admin/close-votes.js
import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

export const POST = async (context) => {
  try {
    const auth = requireAdmin(context);
    if (!auth.ok) return auth.response;

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
