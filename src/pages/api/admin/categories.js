import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, id, name, position } = body;
    const auth = requireAdmin(request, body.token);
    if (!auth.ok) return auth.response;

    if (action === 'add') {
      const { error } = await supabase.from('categories').insert([{ name, position: position || 0 }]);
      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
