import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

// --- GET : liste de tous les participants ---
export async function GET(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, participants: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// --- POST : ajouter un participant ---
export async function POST(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const formData = await context.request.formData();
    const name = (formData.get('name') || '').toString().trim();
    const photoFile = formData.get('photo');

    if (!name) {
      return new Response(JSON.stringify({ success: false, error: 'Le nom est requis' }), { status: 400 });
    }

    let photoUrl = null;

    if (photoFile && typeof photoFile === 'object' && photoFile.size > 0) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const arrayBuffer = await photoFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('candidates')
        .upload(fileName, new Uint8Array(arrayBuffer), { contentType: photoFile.type || 'image/jpeg', upsert: true });

      if (uploadError) {
        return new Response(JSON.stringify({ success: false, error: 'Échec upload photo: ' + uploadError.message }), { status: 500 });
      }

      photoUrl = supabase.storage.from('candidates').getPublicUrl(fileName).data?.publicUrl || null;
    }

    const { data, error } = await supabase
      .from('participants')
      .insert([{ name, photo_url: photoUrl }])
      .select();

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ success: false, error: 'Ce participant existe déjà' }), { status: 409 });
      }
      throw error;
    }

    return new Response(JSON.stringify({ success: true, participant: data?.[0] || null }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// --- PUT : éditer un participant ---
export async function PUT(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const formData = await context.request.formData();
    const id = formData.get('id');
    const name = (formData.get('name') || '').toString().trim();
    const photoFile = formData.get('photo');

    if (!id || !name) {
      return new Response(JSON.stringify({ success: false, error: 'ID et nom requis' }), { status: 400 });
    }

    const updates = { name };

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
      .from('participants')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ success: false, error: 'Ce nom est déjà utilisé' }), { status: 409 });
      }
      throw error;
    }

    return new Response(JSON.stringify({ success: true, participant: data?.[0] || null }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// --- DELETE : supprimer un participant ---
export async function DELETE(context) {
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'ID manquant' }), { status: 400 });
    }

    const { error } = await supabase.from('participants').delete().eq('id', id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
