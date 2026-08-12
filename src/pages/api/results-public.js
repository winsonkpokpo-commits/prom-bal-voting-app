import { supabase } from '../../lib/supabase';

export async function GET() {
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
    for (const v of votes || []) {
      if (!v.participant_id) continue; // votes blancs exclus du classement
      tally[v.category_id] = tally[v.category_id] || {};
      tally[v.category_id][v.participant_id] = (tally[v.category_id][v.participant_id] || 0) + 1;
    }

    const buildRanking = (categoryId) => {
      const counts = tally[categoryId] || {};
      return Object.entries(counts)
        .map(([participantId, count]) => {
          const p = participantLookup[participantId];
          return { name: p?.name || 'Inconnu', photo_url: p?.photo_url || null, count };
        })
        .sort((a, b) => b.count - a.count);
    };

    const king = (categories || []).find(c => c.name === 'Roi du Bal');
    const queen = (categories || []).find(c => c.name === 'Reine du Bal');

    const otherCategories = {};
    for (const cat of categories || []) {
      if (cat.name === 'Roi du Bal' || cat.name === 'Reine du Bal') continue;
      otherCategories[cat.name] = buildRanking(cat.id);
    }

    return new Response(JSON.stringify({
      king: king ? buildRanking(king.id) : [],
      queen: queen ? buildRanking(queen.id) : [],
      categories: otherCategories
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Erreur results-public:', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
}
