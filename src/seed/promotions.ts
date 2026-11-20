import type { Payload } from 'payload';

/**
 * Example promotions for a new site, one per format, as DRAFTS: nothing appears until an editor reviews and publishes
 * one. They only point at what the site really offers (submissions, the store, donations, volunteering) and state no
 * fact about the Center that is not already on those pages. Idempotent: an example whose headline exists is skipped.
 */
const EXAMPLES = [
  { format: 'bar', kind: 'call', tone: 'brand', headline: 'شاركوا بأبحاثكم ومقالاتكم في مجلة حضرموت الثقافية', ctaLabel: 'طريقة المشاركة', ctaUrl: '/submit#magazine', priority: 10 },
  { format: 'card', kind: 'store', tone: 'gold', headline: 'إصدارات المركز متاحة للطلب من المتجر الإلكتروني', text: 'أضيفوا الكتب إلى السلة وأرسلوا الطلب، ويتواصل معكم فريق المركز بالتوفر وطريقة الدفع.', ctaLabel: 'تصفّح الكتب', ctaUrl: '/store', targeting: { pages: ['home', 'books'] } },
  { format: 'popup', kind: 'donation', tone: 'brand', headline: 'ادعموا مشاريع المركز في التوثيق والبحث والنشر', text: 'سجلوا نية التبرع، ويتواصل معكم المركز بطرق التحويل المعتمدة. لا يُخصم أي مبلغ عبر الموقع.', ctaLabel: 'منصة التبرعات', ctaUrl: '/donate', targeting: { pages: ['home'] }, behaviour: { delay: 12, frequency: 'once', hideDays: 30, dismissible: true, trigger: 'delay' } },
  { format: 'corner', kind: 'volunteer', tone: 'paper', headline: 'انضموا إلى متطوعي المركز', text: 'شاركوا بوقتكم وخبرتكم في أنشطة المركز.', ctaLabel: 'بوابة التطوع', ctaUrl: '/volunteer', targeting: { pages: ['articles', 'books', 'events'] }, behaviour: { delay: 20, frequency: 'session', hideDays: 7, dismissible: true, trigger: 'scroll' } },
] as const;

export async function seedExamplePromotions(payload: Payload): Promise<number> {
  let added = 0;
  const start = new Date();
  const end = new Date(start.getTime() + 30 * 86_400_000);
  for (const e of EXAMPLES) {
    const exists = await payload.find({ collection: 'promotions', where: { headline: { equals: e.headline } }, limit: 1, depth: 0, overrideAccess: true, locale: 'ar' as never });
    if (exists.docs.length) continue;
    await payload.create({
      collection: 'promotions',
      locale: 'ar' as never,
      overrideAccess: true,
      context: { fromImport: true },
      data: { ...e, status: 'draft', startAt: start.toISOString(), endAt: end.toISOString() } as never,
    });
    added++;
  }
  return added;
}
