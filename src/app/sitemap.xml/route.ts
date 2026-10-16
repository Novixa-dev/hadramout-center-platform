import { getPayloadClient } from '../../lib/runtime.ts';
import { loadConfig } from '../../config.ts';
import { CONTENT, CONTENT_TYPES } from '../../lib/content-types.ts';
import { getLanguage } from '../../i18n/languages.ts';
import { isIndexable, uiReadyLangs } from '../../lib/seo.ts';
import { getTopics, listAuthors } from '../../lib/facets.ts';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

interface Entry {
  path: string;
  langs: string[];
  lastmod?: string;
  priority: number;
}

/** One <url> per ready language, each listing every alternate (hreflang). */
function urlset(base: string, entries: Entry[]): string {
  const rows: string[] = [];
  for (const e of entries) {
    const langs = e.langs.filter((l) => l === 'ar' || isIndexable(l));
    const alternates = [...langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${getLanguage(l)?.tag ?? l}" href="${esc(`${base}/${l}${e.path}`)}"/>`), `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(`${base}/ar${e.path}`)}"/>`].join('\n');
    for (const l of langs) {
      rows.push(`  <url>\n    <loc>${esc(`${base}/${l}${e.path}`)}</loc>\n${e.lastmod ? `    <lastmod>${e.lastmod.slice(0, 10)}</lastmod>\n` : ''}    <priority>${e.priority.toFixed(1)}</priority>\n${alternates}\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}

const TTL_MS = 60 * 60 * 1000;
let cached: { at: number; xml: string } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.at < TTL_MS) return respond(cached.xml);
  const base = loadConfig().siteUrl;
  const payload = await getPayloadClient();
  const ui = uiReadyLangs();
  const entries: Entry[] = [{ path: '', langs: ui, priority: 1 }];
  // /search and /saved are noindex pages and never listed
  for (const p of ['/timeline', '/about', '/contact', '/privacy', '/terms', '/accessibility']) entries.push({ path: p, langs: ['ar', 'en'], priority: 0.4 });
  entries.push({ path: '/authors', langs: ['ar'], priority: 0.6 }, { path: '/topics', langs: ['ar'], priority: 0.7 });
  for (const t of CONTENT_TYPES) {
    const info = CONTENT[t];
    const listEntry: Entry = { path: `/${info.route}`, langs: ui, priority: 0.8 };
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
      entries.push({ path: `/${info.route}/${d.id}`, langs, lastmod: d.updatedAt, priority: t === 'article' || t === 'book' ? 0.7 : 0.5 });
    }
  }
  // author pages and topic landing pages (Arabic only: names are not translated)
  const [authors, topics] = await Promise.all([listAuthors('ar'), getTopics('ar')]);
  for (const a of authors) entries.push({ path: `/authors/${a.id}`, langs: ['ar'], priority: 0.5 });
  for (const n of topics.byId.values()) if (n.total > 0) entries.push({ path: `/topics/${n.id}`, langs: ['ar'], priority: 0.6 });
  cached = { at: Date.now(), xml: urlset(base, entries) };
  return respond(cached.xml);
}

const respond = (xml: string) => new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600, s-maxage=3600' } });
