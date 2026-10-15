import { getPayloadClient } from '../../../../lib/runtime.ts';
import { loadConfig } from '../../../../config.ts';
import { CONTENT, CONTENT_TYPES, typeFromRoute, type ContentType } from '../../../../lib/content-types.ts';
import { getLanguage } from '../../../../i18n/languages.ts';
import { htmlToText } from '../../../../lib/sanitize.ts';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** RSS 2.0 feed per language: /feeds/ar/all.xml, /feeds/en/articles.xml … */
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string; file: string }> }) {
  const { lang, file } = await params;
  const language = getLanguage(lang);
  const name = file.replace(/\.xml$/, '');
  if (!language || !file.endsWith('.xml')) return new Response('Not found', { status: 404 });
  const types: ContentType[] = name === 'all' ? ['news', 'article', 'book', 'magazine', 'event'] : typeFromRoute(name) ? [typeFromRoute(name)!.type] : [];
  if (types.length === 0 || !CONTENT_TYPES.includes(types[0] as ContentType)) return new Response('Not found', { status: 404 });
  const base = loadConfig().siteUrl;
  const payload = await getPayloadClient();
  const items: { title: string; link: string; desc: string; date?: string }[] = [];
  for (const t of types) {
    const info = CONTENT[t];
    const res = await payload.find({ collection: info.slug, where: { status: { equals: 'published' } }, sort: '-publishedAt', limit: 30, depth: 0, locale: lang as never, fallbackLocale: 'ar' });
    for (const d of res.docs as unknown as { id: number; title: string; excerpt?: string; body?: string; publishedAt?: string; datePrecision?: string }[]) {
      items.push({ title: d.title, link: `${base}/${lang}/${info.route}/${d.id}`, desc: d.excerpt || htmlToText(d.body ?? '').slice(0, 300), date: d.publishedAt && d.datePrecision === 'day' ? new Date(d.publishedAt).toUTCString() : undefined });
    }
  }
  items.sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n<title>مركز حضرموت للدراسات التاريخية والتوثيق والنشر</title>\n<link>${base}/${lang}</link>\n<description>Hadhramout Center</description>\n<language>${language.tag}</language>\n<atom:link href="${base}/feeds/${lang}/${file}" rel="self" type="application/rss+xml"/>\n${items.slice(0, 50).map((i) => `<item><title>${esc(i.title)}</title><link>${esc(i.link)}</link><guid>${esc(i.link)}</guid><description>${esc(i.desc)}</description>${i.date ? `<pubDate>${i.date}</pubDate>` : ''}</item>`).join('\n')}\n</channel></rss>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=900' } });
}
