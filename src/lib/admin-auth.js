import crypto from 'node:crypto';

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h, aligné sur le Max-Age du cookie

export function getAdminSecret() {
  return process.env.ADMIN_SECRET_KEY || import.meta.env.ADMIN_SECRET_KEY || '';
}

export function checkPassword(password) {
  const secret = getAdminSecret();
  if (!secret || !password) return false;

  const cleanPassword = String(password).trim();
  const cleanSecret = String(secret).trim();

  try {
    const a = Buffer.from(cleanPassword);
    const b = Buffer.from(cleanSecret);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sign(payload) {
  const secret = getAdminSecret();
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

// Crée un token de session signé : "timestamp.signature"
// Impossible à forger sans connaître ADMIN_SECRET_KEY.
export function createSessionToken() {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  return `${issuedAt}.${signature}`;
}

// Vérifie la signature ET l'expiration d'un token de session
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;

  const secret = getAdminSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [issuedAt, signature] = parts;
  if (!/^\d+$/.test(issuedAt)) return false;

  const expected = sign(issuedAt);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    if (!crypto.timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  const age = Date.now() - parseInt(issuedAt, 10);
  return age >= 0 && age <= SESSION_MAX_AGE_MS;
}

function getCookieValue(cookieHeader, name) {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function isAdminAuthenticated(context) {
  const request = context.request || context;
  const cookieHeader = request.headers?.get('cookie') || '';
  const token = getCookieValue(cookieHeader, 'admin_session');
  return verifySessionToken(token);
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
