import { NextResponse } from 'next/server';
import { extras } from '../../../../lib/extras.ts';
import { suggestTitles } from '../../../../db/search.ts';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { typeFromSlug, type CollectionSlug } from '../../../../lib/content-types.ts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') ?? '').trim().slice(0, 80);
  const lang = u.searchParams.get('lang') ?? 'ar';
  if (q.length < 2) return NextResponse.json({ items: [] });
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
