import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

export async function GET(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('position', { ascending: true });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, categories: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function POST(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const body = await context.request.json();
    const name = (body.name || '').trim();
    const slots = Math.min(5, Math.max(1, parseInt(body.slots, 10) || 1));

    if (!name) {
      return new Response(JSON.stringify({ success: false, error: 'Nom de catégorie requis' }), { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    const nextPosition = existing && existing.length > 0 ? (existing[0].position || 0) + 1 : 1;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, position: nextPosition, slots }])
      .select();

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ success: false, error: 'Cette catégorie existe déjà' }), { status: 409 });
      }
      throw error;
    }

    return new Response(JSON.stringify({ success: true, category: data?.[0] || null }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function DELETE(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ success: false, error: 'ID manquant' }), { status: 400 });

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
