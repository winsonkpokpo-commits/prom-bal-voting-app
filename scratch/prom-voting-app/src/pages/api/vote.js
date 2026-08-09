import { supabase } from '../../lib/supabase';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { voter_slug, voter_name, king, queen, categories } = body;

    if (!voter_slug || !voter_name) {
      return new Response(JSON.stringify({ error: "Votant invalide" }), { status: 400 });
    }

    // Vérifier si les votes sont ouverts
    const { data: config } = await supabase.from('config').select('voting_closed').eq('id', 1).single();
    if (config?.voting_closed) {
      return new Response(JSON.stringify({ error: "Les votes sont clos" }), { status: 403 });
    }

    // Enregistrer le vote (upsert basé sur voter_slug)
    const { error } = await supabase.from('ballots').upsert({
      voter_slug,
      voter_name,
      king: king || null,
      queen: queen || null,
      votes: categories || {},
      created_at: new Date().toISOString()
    }, {
      onConflict: 'voter_slug'
    });

    if (error) {
      console.error("Erreur vote:", error);
      return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement du vote" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("Exception vote:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
};
