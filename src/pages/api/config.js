import { supabase } from '../../lib/supabase';

export const GET = async () => {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('voting_closed')
      .eq('id', 1)
      .single();

    if (error) {
      console.error("Erreur lecture config:", error);
      return new Response(JSON.stringify({ error: "Erreur lors de la lecture de la configuration" }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("Exception config:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
};
