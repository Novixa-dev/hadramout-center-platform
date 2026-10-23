/**
 * sitemap.xml builder (pure, so it can be unit-tested). One <url> per listed language, each carrying every alternate (hreflang).
 * No <priority> or <changefreq>: Google documents that it ignores both; <lastmod> is emitted only when the document's real update date is known.
 */
export interface SitemapEntry {
  /** path without language prefix ("" for the home page) */
  path: string;
  langs: string[];
  lastmod?: string;
}

export interface SitemapOptions {
  /** whether a language may be listed (Arabic always; others only when indexable) */
  keep: (lang: string) => boolean;
  /** hreflang tag of a language code, e.g. "ar" → "ar", "pt-br" → "pt-BR" */
  tag: (lang: string) => string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (iso: string | undefined) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : undefined);

export function urlset(base: string, entries: SitemapEntry[], opts: SitemapOptions): string {
  const rows: string[] = [];
  for (const e of entries) {
    const langs = e.langs.filter(opts.keep);
    if (!langs.length) continue;
    const alternates = [
      ...langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${esc(opts.tag(l))}" href="${esc(`${base}/${l}${e.path}`)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(`${base}/ar${e.path}`)}"/>`,
    ].join('\n');
    const lastmod = day(e.lastmod);
    for (const l of langs) {
      rows.push(`  <url>\n    <loc>${esc(`${base}/${l}${e.path}`)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}${alternates}\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}
