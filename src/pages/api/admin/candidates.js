import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

// --- 1. GET : LIRE LA LISTE DES CANDIDATS ---
export async function GET(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, candidates: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// --- 2. POST : AJOUTER UN NOUVEAU CANDIDAT ---
export async function POST(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const formData = await context.request.formData();
    const name = formData.get('name');
    const category = formData.get('category');
    const photoFile = formData.get('photo');

    if (!name || !category) {
      return new Response(JSON.stringify({ success: false, error: 'Nom et catégorie requis' }), { status: 400 });
    }

    let photoUrl = null;

    if (photoFile && typeof photoFile === 'object' && photoFile.size > 0) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const arrayBuffer = await photoFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('candidates')
        .upload(fileName, new Uint8Array(arrayBuffer), { contentType: photoFile.type || 'image/jpeg', upsert: true });

      if (!uploadError) {
        photoUrl = supabase.storage.from('candidates').getPublicUrl(fileName).data?.publicUrl || null;
      }
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert([{ name: name.trim(), category: category.trim(), photo_url: photoUrl }])
      .select();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, candidate: data?.[0] || null }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// --- 3. PUT : ÉDITER / MODIFIER UN CANDIDAT ---
export async function PUT(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const formData = await context.request.formData();
    const id = formData.get('id');
    const name = formData.get('name');
    const category = formData.get('category');
    const photoFile = formData.get('photo');

    if (!id || !name || !category) {
      return new Response(JSON.stringify({ success: false, error: 'ID, Nom et Catégorie requis' }), { status: 400 });
    }

    const updates = {
      name: name.trim(),
      category: category.trim()
    };

    // Si une nouvelle photo a été importée, on la met à jour
    if (photoFile && typeof photoFile === 'object' && photoFile.size > 0) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const arrayBuffer = await photoFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('candidates')
        .upload(fileName, new Uint8Array(arrayBuffer), { contentType: photoFile.type || 'image/jpeg', upsert: true });

      if (!uploadError) {
        updates.photo_url = supabase.storage.from('candidates').getPublicUrl(fileName).data?.publicUrl || null;
      }
    }

    const { data, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, candidate: data?.[0] || null }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// --- 4. DELETE : SUPPRIMER UN CANDIDAT ---
export async function DELETE(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'ID manquant' }), { status: 400 });
    }

    const { error } = await supabase.from('candidates').delete().eq('id', id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
