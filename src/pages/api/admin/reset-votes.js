import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

export const POST = async (context) => {
  try {
    const auth = requireAdmin(context);
    if (!auth.ok) return auth.response;

    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (votesError) {
      console.error("Erreur reset-votes (votes):", votesError);
      return new Response(JSON.stringify({ error: "Impossible de réinitialiser les votes" }), { status: 500 });
    }

    const { error: receiptsError } = await supabase
      .from('vote_receipts')
      .delete()
      .not('voter_slug', 'is', null);

    if (receiptsError) {
      console.error("Erreur reset-votes (receipts):", receiptsError);
      return new Response(JSON.stringify({ error: "Votes supprimés mais échec de réinitialisation des reçus" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Exception reset-votes:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
};
