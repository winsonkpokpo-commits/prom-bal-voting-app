import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const auth = requireAdmin(request, body.token);
    if (!auth.ok) return auth.response;

    const { error } = await supabase.from('config').update({ voting_closed: false }).eq('id', 1);

    if (error) {
      console.error("Erreur reopen-votes:", error);
      return new Response(JSON.stringify({ error: "Impossible de rouvrir les votes" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Exception reopen-votes:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
};
