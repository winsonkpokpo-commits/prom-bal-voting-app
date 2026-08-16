import { requireAdmin } from '../../lib/admin-auth';
import { supabase } from '../../lib/supabase';
import { computeResults } from '../../lib/tally';

export async function GET(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slots')
      .order('position', { ascending: true });
    if (catError) throw catError;

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('category_id, participant_id, voter_slug');
    if (votesError) throw votesError;

    const { data: participants, error: partError } = await supabase
      .from('participants')
      .select('id, name, photo_url');
    if (partError) throw partError;

    const { results, totalBallots, blankCount } = computeResults(categories, votes, participants);

    return new Response(JSON.stringify({
      success: true,
      total: totalBallots,
      blank: blankCount,
      results
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
