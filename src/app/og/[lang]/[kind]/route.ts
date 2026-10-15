import { pageCard } from '../../../../lib/og-data.ts';
import { OG_HEADERS, fallbackResponse, renderCard } from '../../../../lib/og-render.ts';
import { allow, clientKey } from '../../../../lib/ratelimit.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** /og/{lang}/{home|articles|authors|…}.png — branded social card for a list or landing page. */
export async function GET(req: Request, { params }: { params: Promise<{ lang: string; kind: string }> }) {
  const { lang, kind: key } = await params;
  if (!allow(`og:${clientKey(req)}`, 90, 60)) return new Response('Too many requests', { status: 429, headers: { 'retry-after': '60' } });
  try {
    const card = await pageCard(lang, key.replace(/\.png$/i, ''));
    if (!card) return new Response('Not found', { status: 404 });
    const png = await renderCard(`${lang}:page:${key}:${card.version}`, card.input);
    return new Response(new Uint8Array(png), { headers: OG_HEADERS });
  } catch (err) {
    console.error('[og]', (err as Error).message);
    return fallbackResponse(req);
  }
}
