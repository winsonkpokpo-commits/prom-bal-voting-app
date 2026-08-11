import { requireAdmin } from '../../../lib/admin-auth';
import { supabase } from '../../../lib/supabase';

export async function POST(context) {
  // 1. Vérification de la session admin
  const auth = requireAdmin(context);
  if (!auth.ok) return auth.response;

  try {
    const { request } = context;
    const formData = await request.formData();

    const name = formData.get('name');
    const category = formData.get('category');
    const photoFile = formData.get('photo');

    if (!name || !category) {
      return new Response(
        JSON.stringify({ success: false, error: 'Le nom et la catégorie sont obligatoires.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let photoUrl = null;

    // 2. Traitement de la photo si elle est fournie
    if (photoFile && typeof photoFile === 'object' && photoFile.size > 0) {
      try {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const arrayBuffer = await photoFile.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload vers le bucket Supabase "candidates"
        const { error: uploadError } = await supabase.storage
          .from('candidates')
          .upload(fileName, buffer, {
            contentType: photoFile.type || 'image/jpeg',
            upsert: true
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('candidates')
            .getPublicUrl(fileName);
          
          photoUrl = publicUrlData?.publicUrl || null;
        } else {
          console.error('Erreur Supabase Storage:', uploadError);
        }
      } catch (imgErr) {
        console.error('Erreur traitement photo:', imgErr);
      }
    }

    // 3. Enregistrement dans la table "candidates"
    const { data, error } = await supabase
      .from('candidates')
      .insert([
        {
          name: name.trim(),
          category: category.trim(),
          photo_url: photoUrl
        }
      ])
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: `Erreur Supabase: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, candidate: data?.[0] || null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Erreur serveur: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
