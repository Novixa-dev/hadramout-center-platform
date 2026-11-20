import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { extras } from '../../../../lib/extras.ts';
import { allow, clientKey } from '../../../../lib/ratelimit.ts';
import { isOwnOrigin, readCapped } from '../../../../lib/same-origin.ts';
import { staffUser } from '../../../../lib/staff.ts';
import { PROMO_EVENTS, type PromoEvent } from '../../../../lib/promotions.ts';
import { promoTotals, recordPromoEvent } from '../../../../lib/promo-stats.ts';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'cache-control': 'private, no-store' } });
const none = () => new NextResponse(null, { status: 204, headers: { 'cache-control': 'no-store' } });

/** Crawlers, previews and audits render pages too; their views are not people's. */
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram/i;
const MAX_BYTES = 256;

// ids of published promotions, refreshed at most once a minute: counts for any other id are refused
const g = globalThis as { __hcPromoIds?: { at: number; ids: Set<number> } };
async function publishedIds(): Promise<Set<number>> {
  if (g.__hcPromoIds && Date.now() - g.__hcPromoIds.at < 60_000) return g.__hcPromoIds.ids;
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: 'promotions', where: { status: { equals: 'published' } }, limit: 500, depth: 0, pagination: false, overrideAccess: true, select: {} });
  g.__hcPromoIds = { at: Date.now(), ids: new Set(res.docs.map((d) => Number(d.id))) };
  return g.__hcPromoIds.ids;
}

/**
 * One anonymous count from a visitor's browser: `{"id":12,"e":"view"|"click"|"close"}`, sent with `navigator.sendBeacon`
 * (text/plain, so no preflight). Nothing about the visitor is stored; the limiter keys on a daily-salted hash. Always
 * answers 204 for a count it ignores (bot, unknown promotion) so a script learns nothing.
 */
export async function POST(req: Request) {
  if (!isOwnOrigin(req)) return json({ error: 'forbidden' }, 403);
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES) return json({ error: 'too large' }, 413);
  let body: { id?: unknown; e?: unknown };
  try {
    // read through a cap: a chunked body without Content-Length is never buffered beyond it
    const raw = await readCapped(req, MAX_BYTES);
    if (raw === null) return json({ error: 'too large' }, 413);
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const id = typeof body.id === 'number' && Number.isSafeInteger(body.id) && body.id > 0 ? body.id : null;
  const event = typeof body.e === 'string' && (PROMO_EVENTS as readonly string[]).includes(body.e) ? (body.e as PromoEvent) : null;
  if (!id || !event) return json({ error: 'invalid' }, 400);
  if (BOT.test(req.headers.get('user-agent') ?? '')) return none();
  if (!allow(`promo:${clientKey(req)}`, 300, 3600)) return json({ error: 'rate limited' }, 429);
  if (!(await publishedIds()).has(id)) return none();
  recordPromoEvent(extras(), id, event);
  return none();
}

/** Totals of one promotion for the admin's statistics panel. Staff only. */
export async function GET(req: Request) {
  const user = await staffUser(req.headers);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!allow(`promo-stats:${user.id}`, 600, 3600)) return json({ error: 'rate limited' }, 429);
  const raw = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^\d{1,9}$/.test(raw)) return json({ error: 'invalid' }, 400);
  return json(promoTotals(extras(), Number(raw)));
}
