import type { Metadata } from 'next';
import { getLanguage, LANGUAGES } from '../i18n/languages.ts';
import { uiCoverage } from '../i18n/ui-store.ts';
import { loadConfig } from '../config.ts';
import { absolute, type Ctx } from './ctx.ts';

/** Languages whose interface is complete enough to be indexed as pages (ar, en + well-covered generated ones). */
export function uiReadyLangs(): string[] {
  return LANGUAGES.filter((l) => l.code === 'ar' || l.code === 'en' || uiCoverage(l.code) >= 0.95).map((l) => l.code);
}

export function isIndexable(lang: string): boolean {
  const cfg = loadConfig();
  return lang === 'ar' || cfg.indexableLangs === '*' || cfg.indexableLangs.includes(lang);
}

interface MetaInput {
  ctx: Ctx;
  /** path without language prefix, e.g. "/articles/12" ("/" for home) */
  path: string;
  title: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'article' | 'book';
  /** languages in which this exact page is complete (for hreflang). Defaults to the UI-ready set. */
  readyLangs?: string[];
  /** true when the visitor's language is only partially available on this page → noindex */
  incomplete?: boolean;
  publishedTime?: string | null;
  noindex?: boolean;
  extra?: Metadata['other'];
}

const trim = (s: string | undefined, n: number) => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

export function buildMetadata(m: MetaInput): Metadata {
  const { ctx, path } = m;
  const lang = ctx.lang.code;
  const ready = (m.readyLangs ?? uiReadyLangs()).filter((c) => isIndexable(c) || c === 'ar');
  const url = (code: string) => absolute(`/${code}${path === '/' ? '' : path}`);
  const languages: Record<string, string> = {};
  for (const code of ready) languages[getLanguage(code)?.tag ?? code] = url(code);
  languages['x-default'] = url('ar');
  const noindex = m.noindex || m.incomplete || !isIndexable(lang);
  const image = m.image ?? absolute('/brand/og-default.png');
  const description = trim(m.description, 200);
  return {
    title: m.title,
    description: description || undefined,
    alternates: { canonical: noindex && lang !== 'ar' ? url('ar') : url(lang), languages },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      title: m.title,
      description: description || undefined,
      url: url(lang),
      siteName: ctx.t('header.sub'),
      locale: ctx.lang.og,
      alternateLocale: ready.filter((c) => c !== lang).map((c) => getLanguage(c)?.og ?? c),
      type: m.type === 'book' ? 'book' : m.type === 'article' ? 'article' : 'website',
      images: [{ url: image, width: 1200, height: 630 }],
      ...(m.publishedTime ? { publishedTime: m.publishedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: m.title, description: description || undefined, images: [image] },
    other: m.extra,
  };
}
