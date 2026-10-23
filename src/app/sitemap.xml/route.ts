import { getPayloadClient } from '../../lib/runtime.ts';
import { loadConfig } from '../../config.ts';
import { CONTENT, CONTENT_TYPES } from '../../lib/content-types.ts';
import { getLanguage } from '../../i18n/languages.ts';
import { isIndexable, uiReadyLangs } from '../../lib/seo.ts';
import { urlset, type SitemapEntry as Entry } from '../../lib/sitemap-xml.ts';
import { getTopics, listAuthors } from '../../lib/facets.ts';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const TTL_MS = 60 * 60 * 1000;
let cached: { at: number; xml: string } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.at < TTL_MS) return respond(cached.xml);
  const base = loadConfig().siteUrl;
  const payload = await getPayloadClient();
  const ui = uiReadyLangs();
  const entries: Entry[] = [{ path: '', langs: ui }];
  // /search and /saved are noindex pages and never listed
  for (const p of ['/timeline', '/about', '/contact', '/privacy', '/terms', '/accessibility']) entries.push({ path: p, langs: ['ar', 'en'] });
  entries.push({ path: '/authors', langs: ['ar'] }, { path: '/topics', langs: ['ar'] });
  for (const t of CONTENT_TYPES) {
    const info = CONTENT[t];
    const listEntry: Entry = { path: `/${info.route}`, langs: ui };
    entries.push(listEntry);
    const res = await payload.find({
      collection: info.slug,
      where: { status: { equals: 'published' } },
      limit: 5000,
      pagination: false,
      depth: 0,
      locale: 'ar',
      select: { translationMeta: true, updatedAt: true } as never,
    });
    for (const d of res.docs as unknown as { id: number; updatedAt: string; translationMeta?: Record<string, Record<string, unknown>> | null }[]) {
      if (!listEntry.lastmod || d.updatedAt > listEntry.lastmod) listEntry.lastmod = d.updatedAt;
      const langs = ['ar'];
      for (const [l, m] of Object.entries(d.translationMeta ?? {})) if (m?.title && m.body) langs.push(l); // conservative: documents without a body list only Arabic
      entries.push({ path: `/${info.route}/${d.id}`, langs, lastmod: d.updatedAt });
    }
  }
  // author pages and topic landing pages (Arabic only: names are not translated)
  const [authors, topics] = await Promise.all([listAuthors('ar'), getTopics('ar')]);
  for (const a of authors) entries.push({ path: `/authors/${a.id}`, langs: ['ar'] });
  for (const n of topics.byId.values()) if (n.total > 0) entries.push({ path: `/topics/${n.id}`, langs: ['ar'] });
  cached = { at: Date.now(), xml: urlset(base, entries, { keep: (l) => l === 'ar' || isIndexable(l), tag: (l) => getLanguage(l)?.tag ?? l }) };
  return respond(cached.xml);
}

const respond = (xml: string) => new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600, s-maxage=3600' } });
