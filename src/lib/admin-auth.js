// src/lib/admin-auth.js
import crypto from 'node:crypto';

function getAdminSecret() {
  // Compatible avec les deux façons dont Vercel/Astro peuvent exposer la variable
  return process.env.ADMIN_SECRET_KEY || import.meta.env.ADMIN_SECRET_KEY || '';
}

export function checkPassword(password) {
  const secret = getAdminSecret();
  if (!secret || !password) return false;

  const a = Buffer.from(String(password).trim());
  const b = Buffer.from(String(secret).trim());

  // timingSafeEqual exige des buffers de même longueur
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
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
