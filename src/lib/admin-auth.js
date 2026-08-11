import crypto from 'node:crypto';

const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 heures

const getSigningSecret = () => {
  const secret = import.meta.env.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY;
  if (!secret) throw new Error('ADMIN_SECRET_KEY manquant');
  return secret;
};

const base64url = (input) => Buffer.from(input).toString('base64url');
const fromBase64url = (input) => Buffer.from(input, 'base64url').toString('utf8');

const sign = (payload) =>
  crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');

const parseCookies = (cookieHeader = '') => {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const separatorIndex = cookie.indexOf('=');
      if (separatorIndex === -1) return acc;
      const name = cookie.slice(0, separatorIndex);
      const value = cookie.slice(separatorIndex + 1);
      acc[name] = value;
      return acc;
    }, {});
};

// Jeton signé et SANS ÉTAT : contient sa propre expiration + une signature HMAC.
// Aucune mémoire serveur requise -> fiable avec les fonctions serverless de Vercel,
// qui peuvent traiter chaque requête sur une instance différente.
export const createAdminSession = () => {
  const payload = JSON.stringify({ exp: Date.now() + ADMIN_SESSION_TTL_MS });
  const encodedPayload = base64url(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const buildAdminSessionCookie = (token) => {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : '';
  return `admin_session=${token}; HttpOnly; Path=/; SameSite=Strict${secure}; Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}`;
};

const isValidToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(provided, expected)) return false;

  try {
    const { exp } = JSON.parse(fromBase64url(encodedPayload));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
};

export const requireAdminSession = (request, bodyToken = null) => {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieToken = parseCookies(cookieHeader).admin_session;
  const token = cookieToken || bodyToken || null;
  return isValidToken(token) ? token : null;
};

export const requireAdmin = (request, bodyToken = null) => {
  const token = requireAdminSession(request, bodyToken);

  if (!token) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return { ok: true, token };
};
