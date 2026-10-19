import { docCard } from '../../../../../lib/og-data.ts';
import { OG_HEADERS, fallbackResponse, renderCard } from '../../../../../lib/og-render.ts';
import { allow, clientKey } from '../../../../../lib/ratelimit.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** /og/{lang}/{articles|books|…}/{id}.png — branded 1200×630 social card for one document. */
export async function GET(req: Request, { params }: { params: Promise<{ lang: string; kind: string; id: string }> }) {
  const { lang, kind, id } = await params;
  const n = Number(id.replace(/\.png$/i, ''));
  if (!Number.isInteger(n) || n < 1) return new Response('Not found', { status: 404 });
  if (!allow(`og:${clientKey(req)}`, 90, 60)) return new Response('Too many requests', { status: 429, headers: { 'retry-after': '60' } });
  try {
    const card = await docCard(lang, kind, n);
    if (!card) return new Response('Not found', { status: 404 });
    const png = await renderCard(`${lang}:${kind}:${n}:${card.version}`, card.input);
    return new Response(new Uint8Array(png), { headers: OG_HEADERS });
  } catch (err) {
    console.error('[og]', (err as Error).message);
    return fallbackResponse(req);
  }
}
