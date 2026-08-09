export const POST = async ({ request }) => {
  try {
    const { code } = await request.json();
    const adminKey = import.meta.env.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY;
    
    if (code === adminKey) {
      return new Response(JSON.stringify({ success: true, token: "admin_token_ok" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: "Code incorrect" }), { status: 401 });
  } catch (err) {
    console.error("Exception unlock:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
};
