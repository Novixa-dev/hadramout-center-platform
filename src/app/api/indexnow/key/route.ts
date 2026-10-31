export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return new Response('Not configured', { status: 404 });
  }
  return new Response(key, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
