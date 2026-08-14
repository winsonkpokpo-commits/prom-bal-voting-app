import { supabase } from '../../lib/supabase';
import { computeResults } from '../../lib/tally';

export async function GET() {
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

    const { results } = computeResults(categories, votes, participants);

    const king = results.find(r => r.category === 'Roi du Bal');
    const queen = results.find(r => r.category === 'Reine du Bal');

    const otherCategories = {};
    for (const r of results) {
      if (r.category === 'Roi du Bal' || r.category === 'Reine du Bal') continue;
      otherCategories[r.category] = r.ranking;
    }

    return new Response(JSON.stringify({
      king: king ? king.ranking : [],
      queen: queen ? queen.ranking : [],
      categories: otherCategories
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Erreur results-public:', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
}
