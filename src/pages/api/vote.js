import { requireAdmin } from '../../lib/admin-auth';
import { supabase } from '../../lib/supabase';

export const GET = async ({ request }) => {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { data: ballots, error } = await supabase.from('ballots').select('*');
    if (error) throw error;

    const { data: categoriesData, error: catError } = await supabase.from('categories').select('*').order('position');
    if (catError) throw catError;

    // Les votes stockent désormais des IDs d'élèves (et non plus des noms) :
    // on récupère la liste complète pour pouvoir afficher nom + photo dans les résultats.
    const { data: studentsData, error: studError } = await supabase.from('students').select('id, name, photo_url');
    if (studError) throw studError;

    const studentsById = new Map((studentsData || []).map((s) => [s.id, s]));
    const resolveStudent = (id) => studentsById.get(id) || { name: 'Élève supprimé', photo_url: null };

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
          const candidateId = ballot.votes[catId];
          if (results.categories[catId] && candidateId) {
            results.categories[catId].votes[candidateId] = (results.categories[catId].votes[candidateId] || 0) + 1;
          }
        });
      }
    });

    // Formatage pour un affichage facile
    const formatPodium = (tally) => {
      return Object.entries(tally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, count]) => {
          const student = resolveStudent(id);
          return { name: student.name, photo_url: student.photo_url, count };
        });
    };

    const formatCategory = (cat) => {
       const sorted = Object.entries(cat.votes).sort((a, b) => b[1] - a[1]);
       const total = sorted.reduce((sum, [, count]) => sum + count, 0);
       return {
         name: cat.name,
         total,
         candidates: sorted.map(([id, count]) => {
           const student = resolveStudent(id);
           return { name: student.name, photo_url: student.photo_url, count };
         })
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
