// Reconstruit les "bulletins" (un par électeur et par catégorie) à partir
// des lignes de votes, puis classe par combinaison de participants
// (un seul participant pour les catégories classiques, plusieurs pour les duos)
export function computeResults(categories, votes, participants) {
  const participantLookup = {};
  for (const p of participants || []) participantLookup[p.id] = p;

  const byCategory = {};
  for (const v of votes || []) {
    if (!byCategory[v.category_id]) byCategory[v.category_id] = {};
    if (!byCategory[v.category_id][v.voter_slug]) byCategory[v.category_id][v.voter_slug] = [];
    if (v.participant_id) byCategory[v.category_id][v.voter_slug].push(v.participant_id);
  }

  let totalBallots = 0;
  let blankCount = 0;

  const results = (categories || []).map(cat => {
    const ballotsByVoter = byCategory[cat.id] || {};
    const comboTally = {};

    Object.values(ballotsByVoter).forEach(participantIds => {
      totalBallots++;
      if (!participantIds || participantIds.length === 0) {
        blankCount++;
        return;
      }
      const key = [...participantIds].sort().join('|');
      if (!comboTally[key]) comboTally[key] = { participantIds, count: 0 };
      comboTally[key].count++;
    });

    const ranking = Object.values(comboTally)
      .map(({ participantIds, count }) => {
        const names = participantIds.map(id => participantLookup[id]?.name || 'Inconnu');
        const photo_url = participantLookup[participantIds[0]]?.photo_url || null;
        return { name: names.join(' & '), photo_url, count };
      })
      .sort((a, b) => b.count - a.count);

    return { category_id: cat.id, category: cat.name, slots: cat.slots, ranking };
  });

  return { results, totalBallots, blankCount };
}
