import type { Store } from '../db/store.ts';
import type { PromoEvent } from './promotions.ts';

/**
 * Anonymous promotion counts: one row per promotion, event and UTC day in the extras database. Nothing identifies a
 * visitor; the table can be deleted at any time without losing content.
 */
export function recordPromoEvent(db: Store, promo: number, event: PromoEvent, day = new Date().toISOString().slice(0, 10)): void {
  db.run('INSERT INTO promo_stats (promo, event, day, count) VALUES (?, ?, ?, 1) ON CONFLICT(promo, event, day) DO UPDATE SET count = count + 1', promo, event, day);
}

export interface PromoTotals {
  view: number;
  click: number;
  close: number;
}

const zero = (): PromoTotals => ({ view: 0, click: 0, close: 0 });

/** All-time and last-7-days totals of one promotion, and its first recorded day. */
export function promoTotals(db: Store, promo: number, today = new Date()): { total: PromoTotals; last7: PromoTotals; since: string | null } {
  const from = new Date(today.getTime() - 6 * 86_400_000).toISOString().slice(0, 10);
  const rows = db.all<{ event: string; day: string; count: number }>('SELECT event, day, count FROM promo_stats WHERE promo = ?', promo);
  const total = zero();
  const last7 = zero();
  let since: string | null = null;
  for (const r of rows) {
    if (r.event !== 'view' && r.event !== 'click' && r.event !== 'close') continue;
    total[r.event] += r.count;
    if (r.day >= from) last7[r.event] += r.count;
    if (since === null || r.day < since) since = r.day;
  }
  return { total, last7, since };
}

/** Forget a deleted promotion's counts (its id can be given to the next new promotion). */
export function deletePromoStats(db: Store, promo: number): void {
  db.run('DELETE FROM promo_stats WHERE promo = ?', promo);
}
