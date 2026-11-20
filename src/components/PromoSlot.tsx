import type { Ctx } from '../lib/ctx.ts';
import { PROMO_KINDS, type PromoKind } from '../lib/promotions.ts';
import { listPromotions } from '../lib/promotions-data.ts';
import { PromoCardSlot, type PromoLabels } from './client/Promotions.tsx';

export function promoLabels(ctx: Ctx): PromoLabels {
  return {
    kinds: Object.fromEntries(PROMO_KINDS.map((k) => [k, ctx.t(`promo.kind.${k}`)])) as Record<PromoKind, string>,
    close: ctx.t('promo.close'),
    newTab: `(${ctx.t('a11y.newWindow')})`,
    region: ctx.t('promo.region'),
  };
}

/**
 * The in-page promotion card for one page (`page` = the key editors target: `home`, `articles`, `books`…). Only cards
 * meant for this page are sent (`contained` = inside the page's own container already: false); which one shows for this visitor and minute is decided in the browser.
 */
export async function PromoSlot({ ctx, page, contained = true }: { ctx: Ctx; page: string; contained?: boolean }) {
  const all = await listPromotions(ctx.lang.code, ctx.t('promo.details'));
  const items = all.filter((p) => p.format === 'card' && (p.pages.length === 0 || p.pages.includes(page)));
  if (items.length === 0) return null;
  return <PromoCardSlot items={items} labels={promoLabels(ctx)} contained={contained} />;
}
