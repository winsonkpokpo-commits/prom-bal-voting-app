import { requireAdmin } from '../../lib/admin-auth';
import { supabase } from '../../lib/supabase';

export async function GET(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .order('position', { ascending: true });
    if (catError) throw catError;

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('category_id, participant_id');
    if (votesError) throw votesError;

    const { data: participants, error: partError } = await supabase
      .from('participants')
      .select('id, name, photo_url');
    if (partError) throw partError;

    const participantLookup = {};
    for (const p of participants || []) participantLookup[p.id] = p;

    const tally = {};
    let blankCount = 0;
    for (const v of votes || []) {
      if (!v.participant_id) { blankCount++; continue; }
      tally[v.category_id] = tally[v.category_id] || {};
      tally[v.category_id][v.participant_id] = (tally[v.category_id][v.participant_id] || 0) + 1;
    }

    const results = (categories || []).map(cat => {
      const counts = tally[cat.id] || {};
      const ranking = Object.entries(counts)
        .map(([participantId, count]) => ({
          name: participantLookup[participantId]?.name || 'Inconnu',
          photo_url: participantLookup[participantId]?.photo_url || null,
          count
        }))
        .sort((a, b) => b.count - a.count);
      return { category: cat.name, ranking };
    });

    return new Response(JSON.stringify({
      success: true,
      total: votes ? votes.length : 0,
      blank: blankCount,
      results
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
