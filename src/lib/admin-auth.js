export const requireAdminSession = (context) => {
  // Supporte à la fois context ({ request, cookies }) et Astro (Astro.request, Astro.cookies)
  const request = context?.request || context;
  const cookies = context?.cookies;

  // 1. Vérification via l'API cookies native d'Astro
  if (cookies && typeof cookies.get === 'function') {
    const session = cookies.get('admin_session');
    if (session && session.value === 'authenticated') {
      return true;
    }
  }

  // 2. Vérification de secours via l'en-tête HTTP raw
  const cookieHeader = (request?.headers && typeof request.headers.get === 'function')
    ? (request.headers.get('cookie') || '')
    : '';

  return cookieHeader.includes('admin_session=authenticated');
};

export const requireAdmin = (context) => {
  const ok = requireAdminSession(context);

  if (!ok) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Non autorisé - Session invalide' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  return { ok: true };
};
