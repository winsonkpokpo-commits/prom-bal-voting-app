export async function POST(context) {
  const { request, cookies } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const code = body.code || body.password;
    const adminSecret = process.env.ADMIN_SECRET_KEY || import.meta.env.ADMIN_SECRET_KEY;

    if (!adminSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Clé ADMIN_SECRET_KEY non configurée dans Vercel." }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (code && code.trim() === adminSecret.trim()) {
      // Poser le cookie via l'API native d'Astro
      cookies.set('admin_session', 'authenticated', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
        maxAge: 60 * 60 * 8 // 8 heures
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Code incorrect.' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur: ' + error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
