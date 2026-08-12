import { supabase } from '../../lib/supabase';

export async function GET() {
  try {
    const { data: votes, error: votesError } = await supabase.from('votes').select('category, voted_for');
    if (votesError) throw votesError;

    const { data: candidates, error: candidatesError } = await supabase.from('candidates').select('name, category, photo_url');
    if (candidatesError) throw candidatesError;

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .order('position', { ascending: true });
    if (categoriesError) throw categoriesError;

    const tally = {};
    for (const v of votes || []) {
      const cat = v.category;
      const name = (v.voted_for || '').trim();
      if (!cat || !name) continue;
      tally[cat] = tally[cat] || {};
      tally[cat][name] = (tally[cat][name] || 0) + 1;
    }

    const photoLookup = {};
    for (const c of candidates || []) {
      photoLookup[`${c.category}::${c.name.toLowerCase()}`] = c.photo_url;
    }

    const buildRanking = (cat) => {
      const counts = tally[cat] || {};
      return Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          photo_url: photoLookup[`${cat}::${name.toLowerCase()}`] || null
        }))
        .sort((a, b) => b.count - a.count);
    };

    const otherCategories = {};
    for (const cat of categoriesData || []) {
      if (cat.name === 'Roi du Bal' || cat.name === 'Reine du Bal') continue;
      otherCategories[cat.name] = buildRanking(cat.name);
    }

    return new Response(JSON.stringify({
      king: buildRanking('Roi du Bal'),
      queen: buildRanking('Reine du Bal'),
      categories: otherCategories
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Erreur results-public:', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
}
