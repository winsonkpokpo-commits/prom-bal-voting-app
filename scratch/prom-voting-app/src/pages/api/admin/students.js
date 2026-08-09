import { supabase } from '../../../lib/supabase';

export const POST = async ({ request }) => {
  try {
    const { token, action, id, name } = await request.json();
    if (token !== "admin_token_ok") return new Response("Non autorisé", { status: 401 });

    if (action === 'add') {
      const { error } = await supabase.from('students').insert([{ name }]);
      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
