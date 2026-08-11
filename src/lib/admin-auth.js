export const requireAdminSession = (request, cookies = null) => {
  // 1. Vérification via l'objet cookies natif d'Astro si disponible
  if (cookies && typeof cookies.get === 'function') {
    const session = cookies.get('admin_session');
    if (session && session.value === 'authenticated') {
      return true;
    }
  }

  // 2. Vérification de secours via les en-têtes HTTP de la requête
  const cookieHeader = request.headers?.get?.('cookie') || '';
  return cookieHeader.includes('admin_session=authenticated');
};

export const requireAdmin = (request, cookies = null) => {
  const ok = requireAdminSession(request, cookies);

  if (!ok) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Non autorisé - Session admin invalide ou expirée' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  return { ok: true };
};
