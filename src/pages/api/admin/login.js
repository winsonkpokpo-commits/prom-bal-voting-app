import { checkPassword, createSessionToken } from '../../../lib/admin-auth';

export async function POST({ request }) {
  try {
    let password = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      password = body.password;
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      password = params.get('password');
    }

    if (!password || !checkPassword(password)) {
      return new Response(JSON.stringify({ success: false, error: 'Mot de passe incorrect' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Connexion réussie : cookie signé, impossible à forger sans ADMIN_SECRET_KEY
    const token = createSessionToken();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      }
    });
  } catch (err) {
    console.error("Erreur login admin:", err);
    return new Response(JSON.stringify({ success: false, error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
