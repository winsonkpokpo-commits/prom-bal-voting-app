import crypto from 'node:crypto';

export function getAdminSecret() {
  return process.env.ADMIN_SECRET_KEY || import.meta.env.ADMIN_SECRET_KEY || '';
}

export function checkPassword(password) {
  const secret = getAdminSecret();
  if (!secret || !password) return false;
  
  // Supprime les espaces invisibles accidentels
  const cleanPassword = String(password).trim();
  const cleanSecret = String(secret).trim();

  // Comparaison sécurisée
  if (cleanPassword === cleanSecret) return true;

  try {
    const a = Buffer.from(cleanPassword);
    const b = Buffer.from(cleanSecret);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isAdminAuthenticated(context) {
  const request = context.request || context;
  const cookieHeader = request.headers?.get('cookie') || '';
  return cookieHeader.includes('admin_session=true');
}

export function requireAdmin(context) {
  if (!isAdminAuthenticated(context)) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
  return { ok: true };
}
