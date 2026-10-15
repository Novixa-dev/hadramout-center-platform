import { getPayloadClient } from '../../lib/runtime.ts';
import { loadConfig } from '../../config.ts';
import { CONTENT, CONTENT_TYPES } from '../../lib/content-types.ts';
import { getLanguage } from '../../i18n/languages.ts';
import { isIndexable, uiReadyLangs } from '../../lib/seo.ts';

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

export async function GET() {
  const base = loadConfig().siteUrl;
  const payload = await getPayloadClient();
  const ui = uiReadyLangs();
  const entries: Entry[] = [{ path: '', langs: ui, priority: 1 }];
  for (const p of ['/search', '/authors', '/timeline', '/about', '/contact', '/privacy', '/terms', '/accessibility']) entries.push({ path: p, langs: ['ar', 'en'], priority: 0.4 });
  for (const t of CONTENT_TYPES) {
    const info = CONTENT[t];
    entries.push({ path: `/${info.route}`, langs: ui, priority: 0.8 });
    const res = await payload.find({
      collection: info.slug,
      where: { status: { equals: 'published' } },
      limit: 5000,
      pagination: false,
      depth: 0,
      locale: 'ar',
      select: { translationMeta: true, updatedAt: true, body: true } as never,
    });
    for (const d of res.docs as unknown as { id: number; updatedAt: string; body?: string; translationMeta?: Record<string, Record<string, unknown>> | null }[]) {
      const langs = ['ar'];
      for (const [l, m] of Object.entries(d.translationMeta ?? {})) if (m?.title && (!d.body || m.body)) langs.push(l);
      entries.push({ path: `/${info.route}/${d.id}`, langs, lastmod: d.updatedAt, priority: t === 'article' || t === 'book' ? 0.7 : 0.5 });
    }
  }
  return new Response(urlset(base, entries), { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
