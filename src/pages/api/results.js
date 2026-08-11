import { requireAdmin } from '../../lib/admin-auth';
import { supabase } from '../../lib/supabase';

export async function GET(context) {
  // Vérification stricte de la session admin
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    // Récupération des votes depuis Supabase
    const { data: votes, error } = await supabase
      .from('votes')
      .select('*');

    if (error) throw error;

    const total = votes ? votes.length : 0;

    return new Response(JSON.stringify({ 
      success: true, 
      total: total,
      king: [],
      queen: [],
      categories: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
