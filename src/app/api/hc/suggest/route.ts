import { NextResponse } from 'next/server';
import { extras } from '../../../../lib/extras.ts';
import { suggestTitles } from '../../../../db/search.ts';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { typeFromSlug, type CollectionSlug } from '../../../../lib/content-types.ts';
import { getLanguage } from '../../../../i18n/languages.ts';
import { allow, clientKey } from '../../../../lib/ratelimit.ts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') ?? '').trim().slice(0, 80);
  const requested = u.searchParams.get('lang');
  // an unknown or empty language would end up in the returned hrefs ("//articles/1"), so only real language codes are accepted
  const lang = (requested && getLanguage(requested)?.code) || 'ar';
  if (q.length < 2) return NextResponse.json({ items: [] });
  // typeahead fires while typing; each lookup is synchronous full-text work, so one visitor gets a generous but finite budget
  if (!allow(`sg:${clientKey(req)}`, 90, 60)) return NextResponse.json({ items: [] }, { status: 429, headers: { 'retry-after': '30' } });
  const hits = suggestTitles(extras(), q, lang, 8);
  const payload = await getPayloadClient();
  const items: { title: string; href: string; kind: string }[] = [];
  for (const h of hits) {
    const info = typeFromSlug(h.kind);
    if (!info) continue;
    try {
      const d = (await payload.findByID({ collection: h.kind as CollectionSlug, id: h.id, depth: 0, locale: lang as never, fallbackLocale: 'ar', select: { title: true } as never })) as unknown as { title: string };
      items.push({ title: d.title, href: `/${lang}/${info.route}/${h.id}`, kind: h.kind });
    } catch {
      /* deleted meanwhile */
    }
  }
  return NextResponse.json({ items }, { headers: { 'cache-control': 'public, max-age=60' } });
}
