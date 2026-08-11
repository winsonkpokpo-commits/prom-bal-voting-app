import { checkPassword } from '../../../lib/admin-auth';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!checkPassword(password)) {
      return new Response(JSON.stringify({ success: false, error: 'Mot de passe incorrect' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Création du cookie sécurisé qui dure 7 jours
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': 'admin_session=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800'
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
