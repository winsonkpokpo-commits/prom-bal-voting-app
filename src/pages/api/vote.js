import { supabase } from '../../lib/supabase';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { voter_slug, king, queen, categories } = body;

    if (!voter_slug) {
      return new Response(JSON.stringify({ error: 'Votant invalide' }), { status: 400 });
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', voter_slug)
      .maybeSingle();

    if (studentError) {
      console.error('Erreur vérification étudiant:', studentError);
      return new Response(JSON.stringify({ error: 'Erreur lors de la vérification du votant' }), { status: 500 });
    }

    if (!student) {
      return new Response(JSON.stringify({ error: 'Votant non autorisé' }), { status: 403 });
    }

    // Vérifier si les votes sont ouverts
    const { data: config } = await supabase.from('config').select('voting_closed').eq('id', 1).single();
    if (config?.voting_closed) {
      return new Response(JSON.stringify({ error: 'Les votes sont clos' }), { status: 403 });
    }

    const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('id, name');
    if (categoriesError) {
      console.error('Erreur catégories:', categoriesError);
      return new Response(JSON.stringify({ error: 'Erreur lors de la validation des catégories' }), { status: 500 });
    }

    const { data: studentsData, error: studentsError } = await supabase.from('students').select('id, name');
    if (studentsError) {
      console.error('Erreur étudiants:', studentsError);
      return new Response(JSON.stringify({ error: 'Erreur lors de la validation des candidats' }), { status: 500 });
    }

    const validCategoryIds = new Set((categoriesData || []).map((category) => category.id));
    const validStudentIds = new Set((studentsData || []).map((student) => student.id));
    const requiredCategoryIds = ['king', 'queen'];
    const errors = [];

    if (!categories || typeof categories !== 'object') {
      errors.push('Le payload de catégories est invalide');
    } else {
      Object.keys(categories).forEach((categoryId) => {
        if (!validCategoryIds.has(categoryId)) {
          errors.push(`Catégorie inconnue: ${categoryId}`);
        }
      });
    }

    if (king && !validStudentIds.has(king)) {
      errors.push(`Candidat roi invalide: ${king}`);
    }

    if (queen && !validStudentIds.has(queen)) {
      errors.push(`Candidat reine invalide: ${queen}`);
    }

    Object.entries(categories || {}).forEach(([categoryId, candidateId]) => {
      if (candidateId && !validStudentIds.has(candidateId)) {
        errors.push(`Candidat invalide pour ${categoryId}: ${candidateId}`);
      }
    });

    requiredCategoryIds.forEach((requiredCategoryId) => {
      if (!categories || typeof categories !== 'object' || !(requiredCategoryId in categories)) {
        errors.push(`Catégorie obligatoire manquante: ${requiredCategoryId}`);
      }
    });

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation invalide', details: errors }), { status: 400 });
    }

    // Enregistrer le vote sans remplacement d’un vote existant
    const { error } = await supabase.from('ballots').insert({
      voter_slug: student.id,
      voter_name: student.name,
      king: king || null,
      queen: queen || null,
      votes: categories || {},
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Erreur vote:', error);
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return new Response(JSON.stringify({ error: 'Ce votant a déjà enregistré un vote' }), { status: 409 });
      }
      return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement du vote" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("Exception vote:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
};
