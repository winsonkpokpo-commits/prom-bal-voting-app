const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change le mot de passe ici ou dans les variables d'environnement Vercel

export function checkPassword(password) {
  return password === ADMIN_PASSWORD;
}

export function isAdminAuthenticated(context) {
  const cookieHeader = context.request.headers.get('cookie') || '';
  return cookieHeader.includes('admin_session=true');
}

export function requireAdmin(context) {
  if (!isAdminAuthenticated(context)) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: 'Non autorisé. Veuillez vous connecter.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
  return { ok: true };
}
