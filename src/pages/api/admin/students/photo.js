import { requireAdmin } from '../../../../lib/admin-auth';
import { supabase } from '../../../../lib/supabase';

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const POST = async ({ request }) => {
  try {
    const formData = await request.formData();
    const token = formData.get('token');
    const auth = requireAdmin(request, token);
    if (!auth.ok) return auth.response;

    const studentId = formData.get('student_id');
    const file = formData.get('photo');

    if (!studentId || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Requête invalide' }), { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Format non supporté (jpg, png, webp uniquement)' }), { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return new Response(JSON.stringify({ error: 'Photo trop lourde (3 Mo maximum)' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const extension = file.type.split('/')[1];
    const path = `students/${studentId}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('Erreur upload photo:', uploadError);
      return new Response(JSON.stringify({ error: "Échec de l'envoi de la photo" }), { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('students')
      .update({ photo_url: publicUrlData.publicUrl })
      .eq('id', studentId);

    if (updateError) {
      console.error('Erreur mise à jour photo_url:', updateError);
      return new Response(
        JSON.stringify({ error: "Photo envoyée mais impossible de l'associer à l'élève" }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true, photo_url: publicUrlData.publicUrl }), { status: 200 });
  } catch (err) {
    console.error('Exception photo upload:', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
};
