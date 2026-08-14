import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';
import { slugify } from '../../../lib/slugify';

export async function GET(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const { data, error } = await supabase
      .from('eligible_voters')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, voters: data }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
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
    const rawNames = (body.names || '').toString();
    const names = rawNames.split('\n').map(n => n.trim()).filter(Boolean);

    if (names.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Aucun nom fourni' }), { status: 400 });
    }

    const seen = new Set();
    const rows = [];
    for (const name of names) {
      const slug = slugify(name);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      rows.push({ name, slug });
    }

    const { data, error } = await supabase
      .from('eligible_voters')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
      .select();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, added: data?.length || 0 }), { status: 200 });
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

    const { error } = await supabase.from('eligible_voters').delete().eq('id', id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
