import { supabase } from '../../lib/supabase';

export async function POST({ request, redirect }) {
  try {
    // 1. Lecture des données du formulaire HTML standard
    const formData = await request.formData();
    const category = formData.get('category');
    const voted_for = formData.get('voted_for');

    // 2. Vérification de sécurité
    if (!category || !voted_for) {
      return redirect('/?error=champs_manquants');
    }

    // 3. Enregistrement sécurisé dans Supabase
    const { error } = await supabase
      .from('votes')
      .insert([
        { category: category.trim(), voted_for: voted_for.trim() }
      ]);

    if (error) {
      console.error("Erreur d'insertion Supabase:", error);
      return redirect('/?error=bdd');
    }

    // 4. Succès ! On renvoie l'élève à l'accueil avec un marqueur de réussite
    return redirect('/?success=1');

  } catch (err) {
    console.error("Crash API Vote:", err);
    return redirect('/?error=crash_serveur');
  }
}
