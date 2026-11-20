import { cache } from 'react';
import { getPayloadClient } from './runtime.ts';
import { byPriority, type PromoView } from './promotions.ts';
import { toPromoView, type PromotionDoc } from './promotion-view.ts';

/**
 * Promotions starting further ahead than this are left out of the page. A cached page is regenerated every few minutes
 * under traffic and on every edit, so a day is plenty; a scheduled text is in the page source at most a day early.
 */
const LOOKAHEAD_MS = 86_400_000;
/** At most this many candidates per format reach the page (the first live one for the visitor is shown). */
const PER_FORMAT = 4;

/**
 * Published promotions that have not ended and start within the lookahead, in priority order, at most a few per format.
 * Whether one is live right now for a visitor is decided in the browser (src/lib/promotions.ts), so cached pages keep
 * exact times. Cached per request: the layout and the page share one query.
 */
export const listPromotions = cache(async (lang: string, detailsLabel: string): Promise<PromoView[]> => {
  const localize = (path: string) => `/${lang}${path === '/' ? '' : path}`;
  const payload = await getPayloadClient();
  const now = Date.now();
  let docs: PromotionDoc[];
  try {
    const res = await payload.find({
      collection: 'promotions',
      where: {
        and: [
          { status: { equals: 'published' } },
          { startAt: { less_than_equal: new Date(now + LOOKAHEAD_MS).toISOString() } },
          { or: [{ endAt: { exists: false } }, { endAt: { equals: null } }, { endAt: { greater_than: new Date(now).toISOString() } }] },
        ],
      },
      sort: '-priority',
      limit: 40,
      depth: 1,
      locale: lang as never,
      fallbackLocale: 'ar' as never,
    });
    docs = res.docs as unknown as PromotionDoc[];
  } catch (err) {
    // promotions are an extra: a failure here must never take a page down
    payload.logger.error({ err, msg: 'promotions could not be loaded' });
    return [];
  }
  const views = docs.map((d) => toPromoView(d, localize, detailsLabel)).filter((v): v is PromoView => v !== null).sort(byPriority);
  const count: Record<string, number> = {};
  return views.filter((v) => (count[v.format] = (count[v.format] ?? 0) + 1) <= PER_FORMAT);
});
