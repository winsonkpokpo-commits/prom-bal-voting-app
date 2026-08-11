import { buildAdminSessionCookie, createAdminSession } from '../../../lib/admin-auth';

export const POST = async ({ request }) => {
  try {
    const { code } = await request.json();
    const adminKey = import.meta.env.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY;

    if (code === adminKey) {
      const token = createAdminSession();
      return new Response(JSON.stringify({ success: true, loggedIn: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': buildAdminSessionCookie(token)
        }
      });
    }

    return new Response(JSON.stringify({ error: 'Code incorrect' }), { status: 401 });
  } catch (err) {
    console.error('Exception unlock:', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
};
