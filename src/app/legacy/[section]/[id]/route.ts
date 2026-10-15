import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { typeFromRoute } from '../../../../lib/content-types.ts';

export const dynamic = 'force-dynamic';

/** 301 from old links (hadramout.center/articles/9597) to the new language-prefixed URL. */
export async function GET(req: Request, { params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  const info = typeFromRoute(section);
  const lang = req.headers.get('cookie')?.match(/hc_lang=([\w-]+)/)?.[1] ?? 'ar';
  if (!info || !/^\d+$/.test(id)) return NextResponse.redirect(new URL(`/${lang}`, req.url), 302);
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: info.slug, where: { legacyId: { equals: Number(id) } }, limit: 1, depth: 0, overrideAccess: true, select: { id: true } as never });
  const doc = res.docs[0] as unknown as { id: number } | undefined;
  const target = doc ? `/${lang}/${info.route}/${doc.id}` : `/${lang}/${info.route}`;
  return NextResponse.redirect(new URL(target, req.url), doc ? 301 : 302);
}
