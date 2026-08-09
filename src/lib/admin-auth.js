import crypto from 'node:crypto';

const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const adminSessions = new Map();

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

export const createAdminSession = () => {
  const token = crypto.randomBytes(24).toString('hex');
  adminSessions.set(token, { expiresAt: Date.now() + ADMIN_SESSION_TTL_MS });
  return token;
};

export const buildAdminSessionCookie = (token) => {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : '';
  return `admin_session=${token}; HttpOnly; Path=/; SameSite=Strict${secure}; Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}`;
};

export const requireAdminSession = (request, bodyToken = null) => {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieToken = parseCookies(cookieHeader).admin_session;
  const token = cookieToken || bodyToken || null;

  if (!token) return null;

  const session = adminSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return null;
  }

  return token;
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
