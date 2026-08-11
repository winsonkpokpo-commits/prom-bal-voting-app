export async function POST() {
  // Suppression du cookie en le périmant
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  });

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}
