import { mediaUrl } from './media-links.ts';
import { PROMO_FORMATS, PROMO_KINDS, PROMO_TONES, promoHref, type PromoView } from './promotions.ts';

/** A promotion document as Payload returns it at depth 1 (loosely typed: older rows may lack newer fields). */
export interface PromotionDoc {
  id: number;
  headline?: string | null;
  text?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  image?: { url?: string | null; alt?: string | null; width?: number | null; height?: number | null } | number | null;
  targeting?: { pages?: string[] | null; device?: string | null } | null;
  behaviour?: { dismissible?: boolean | null; hideDays?: number | null; frequency?: string | null; trigger?: string | null; delay?: number | null } | null;
  format?: string | null;
  kind?: string | null;
  tone?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  priority?: number | null;
}

const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

/** A stored promotion as the site renders it; null when it cannot be shown (no headline, bad dates). */
export function toPromoView(d: PromotionDoc, localize: (path: string) => string, detailsLabel: string): PromoView | null {
  const headline = (d.headline ?? '').trim();
  const start = d.startAt ? Date.parse(d.startAt) : NaN;
  const end = d.endAt ? Date.parse(d.endAt) : null;
  if (!headline || Number.isNaN(start) || (end !== null && (Number.isNaN(end) || end <= start))) return null;
  const link = promoHref(d.ctaUrl, localize);
  const img = typeof d.image === 'object' && d.image ? d.image : null;
  const imageUrl = mediaUrl(img);
  const b = d.behaviour ?? {};
  const format = oneOf(PROMO_FORMATS, d.format, 'card');
  return {
    id: d.id,
    format,
    start,
    end,
    pages: (d.targeting?.pages ?? []).filter((p) => typeof p === 'string'),
    device: oneOf(['all', 'mobile', 'desktop'] as const, d.targeting?.device, 'all'),
    // overlays can always be closed, whatever the setting says: nothing may sit over the page for good
    dismissible: format === 'popup' || format === 'corner' ? true : b.dismissible !== false,
    hideDays: Math.max(0, Math.min(365, Math.round(b.hideDays ?? 7))),
    freq: oneOf(['once', 'session', 'always'] as const, b.frequency, 'once'),
    trigger: oneOf(['delay', 'scroll'] as const, b.trigger, 'delay'),
    delay: Math.max(3, Math.min(120, Math.round(b.delay ?? 8))),
    priority: Math.round(d.priority ?? 0),
    kind: oneOf(PROMO_KINDS, d.kind, 'notice'),
    tone: oneOf(PROMO_TONES, d.tone, 'brand'),
    headline,
    text: d.text?.trim() || null,
    image: imageUrl && img ? { url: imageUrl, alt: img.alt ?? '', width: img.width ?? null, height: img.height ?? null } : null,
    cta: link ? { label: d.ctaLabel?.trim() || detailsLabel, href: link.href, external: link.external } : null,
  };
}
