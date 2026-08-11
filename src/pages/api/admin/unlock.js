import { createAdminSession, buildAdminSessionCookie } from '../../../lib/admin-auth';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { code } = body;

    // Vérification du mot de passe avec la variable d'environnement
    if (code === import.meta.env.ADMIN_SECRET_KEY) {
      // 1. On crée le jeton chiffré
      const token = createAdminSession();
      // 2. On fabrique l'en-tête du cookie
      const cookieHeader = buildAdminSessionCookie(token);

      // 3. On répond "Succès" en ATTACHANT le cookie au navigateur
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      });
    }

    // Si le code est faux
    return new Response(JSON.stringify({ success: false, error: 'Code incorrect' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
