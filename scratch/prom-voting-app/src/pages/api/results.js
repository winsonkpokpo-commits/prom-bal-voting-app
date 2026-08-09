import { supabase } from '../../lib/supabase';

export const GET = async () => {
  try {
    const { data: ballots, error } = await supabase.from('ballots').select('*');
    if (error) throw error;

    const { data: categoriesData, error: catError } = await supabase.from('categories').select('*').order('position');
    if (catError) throw catError;

    // Dépouillement
    const results = {
      king: {},
      queen: {},
      categories: {}
    };

    categoriesData.forEach(c => {
      results.categories[c.id] = { name: c.name, votes: {} };
    });

    let totalVotes = ballots.length;

    ballots.forEach(ballot => {
      if (ballot.king) results.king[ballot.king] = (results.king[ballot.king] || 0) + 1;
      if (ballot.queen) results.queen[ballot.queen] = (results.queen[ballot.queen] || 0) + 1;

      if (ballot.votes) {
        Object.keys(ballot.votes).forEach(catId => {
          const candidate = ballot.votes[catId];
          if (results.categories[catId] && candidate) {
            results.categories[catId].votes[candidate] = (results.categories[catId].votes[candidate] || 0) + 1;
          }
        });
      }
    });

    // Formatage pour un affichage facile
    const formatPodium = (tally) => {
      return Object.entries(tally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));
    };

    const formatCategory = (cat) => {
       const sorted = Object.entries(cat.votes).sort((a, b) => b[1] - a[1]);
       return {
         name: cat.name,
         total: sorted.reduce((sum, [, count]) => sum + count, 0),
         candidates: sorted.map(([name, count]) => ({ name, count }))
       };
    };

    return new Response(JSON.stringify({
      total: totalVotes,
      king: formatPodium(results.king),
      queen: formatPodium(results.queen),
      categories: Object.values(results.categories).map(formatCategory)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("Exception results:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur lors du dépouillement" }), { status: 500 });
  }
};
