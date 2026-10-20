import type { Where } from 'payload';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { makeT } from '../../../../i18n/t.ts';
import { loadConfig } from '../../../../config.ts';
import { CONTENT, CONTENT_TYPES, typeFromRoute, type ContentType } from '../../../../lib/content-types.ts';
import { getLanguage } from '../../../../i18n/languages.ts';
import { htmlToText } from '../../../../lib/sanitize.ts';
import { stripReferenceLine } from '../../../../lib/seo-text.ts';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Scope {
  types: ContentType[];
  /** extra filter for each collection, keyed by content type */
  where?: (type: ContentType) => Where | null;
  /** feed subtitle (topic or author name) and the page the channel links to */
  heading?: string;
  channelPath: string;
}

/**
 * RSS 2.0 feeds per language:
 *   /feeds/ar/all.xml · /feeds/en/articles.xml          — whole site or one section
 *   /feeds/ar/topic-54.xml                               — articles filed under a topic (and its sub-categories)
 *   /feeds/ar/author-146.xml                             — articles and books of one author
 */
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string; file: string }> }) {
  const { lang, file } = await params;
  const language = getLanguage(lang);
  if (!language || !file.endsWith('.xml')) return new Response('Not found', { status: 404 });
  const name = file.replace(/\.xml$/, '');
  const base = loadConfig().siteUrl;
  const payload = await getPayloadClient();

  let scope: Scope | null = null;
  const topic = name.match(/^topic-(\d{1,9})$/);
  const author = name.match(/^author-(\d{1,9})$/);
  if (name === 'all') scope = { types: ['news', 'article', 'book', 'magazine', 'event'], channelPath: `/${lang}` };
  else if (topic) {
    const id = Number(topic[1]);
    const cat = await payload.findByID({ collection: 'categories', id, depth: 0, locale: lang as never, fallbackLocale: 'ar' }).catch(() => null);
    if (!cat) return new Response('Not found', { status: 404 });
    const children = await payload.find({ collection: 'categories', where: { parent: { equals: id } }, limit: 200, pagination: false, depth: 0 });
    const ids = [id, ...children.docs.map((c) => c.id as number)];
    scope = { types: ['article'], where: () => ({ category: { in: ids } }), heading: (cat as unknown as { name: string }).name, channelPath: `/${lang}/topics/${id}` };
  } else if (author) {
    const id = Number(author[1]);
    const a = await payload.findByID({ collection: 'authors', id, depth: 0, locale: lang as never, fallbackLocale: 'ar' }).catch(() => null);
    if (!a) return new Response('Not found', { status: 404 });
    scope = { types: ['article', 'book'], where: () => ({ authors: { equals: id } }), heading: (a as unknown as { name: string }).name, channelPath: `/${lang}/authors/${id}` };
  } else {
    const info = typeFromRoute(name);
    if (info && CONTENT_TYPES.includes(info.type)) scope = { types: [info.type], channelPath: `/${lang}` };
  }
  if (!scope) return new Response('Not found', { status: 404 });

  const items: { title: string; link: string; desc: string; date?: string }[] = [];
  for (const t of scope.types) {
    const info = CONTENT[t];
    const extra = scope.where?.(t);
    const res = await payload.find({
      collection: info.slug,
      where: extra ? { and: [{ status: { equals: 'published' } }, extra] } : { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 30,
      depth: 0,
      locale: lang as never,
      fallbackLocale: 'ar',
    });
    for (const d of res.docs as unknown as { id: number; title: string; excerpt?: string; body?: string; publishedAt?: string; datePrecision?: string }[]) {
      items.push({ title: d.title, link: `${base}/${lang}/${info.route}/${d.id}`, desc: stripReferenceLine(d.excerpt) || htmlToText(d.body ?? '').slice(0, 300), date: d.publishedAt && d.datePrecision === 'day' ? new Date(d.publishedAt).toUTCString() : undefined });
    }
  }
  items.sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0));

  const siteName = makeT(lang)('site.name');
  const title = scope.heading ? `${scope.heading} — ${siteName}` : siteName;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n<title>${esc(title)}</title>\n<link>${base}${scope.channelPath}</link>\n<description>${esc(title)}</description>\n<language>${language.tag}</language>\n<atom:link href="${base}/feeds/${lang}/${file}" rel="self" type="application/rss+xml"/>\n${items.slice(0, 50).map((i) => `<item><title>${esc(i.title)}</title><link>${esc(i.link)}</link><guid>${esc(i.link)}</guid><description>${esc(i.desc)}</description>${i.date ? `<pubDate>${i.date}</pubDate>` : ''}</item>`).join('\n')}\n</channel></rss>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=900' } });
}
