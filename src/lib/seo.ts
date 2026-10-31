import type { Metadata } from 'next';
import { getLanguage, LANGUAGES } from '../i18n/languages.ts';
import { uiCoverage } from '../i18n/ui-store.ts';
import { loadConfig } from '../config.ts';
import { absolute, type Ctx } from './ctx.ts';
import { isProductionSite } from './site-env.ts';
import { getSite } from './data.ts';
import { clip, describe, isoOrUndefined, mimeTypeOf, socialTitle, titlePart, twitterHandle, withPage } from './seo-text.ts';

/** Languages whose interface is complete enough to be indexed as pages (ar, en + well-covered generated ones). */
export function uiReadyLangs(): string[] {
  return LANGUAGES.filter((l) => l.code === 'ar' || l.code === 'en' || uiCoverage(l.code) >= 0.95).map((l) => l.code);
}

export function isIndexable(lang: string): boolean {
  const cfg = loadConfig();
  return lang === 'ar' || cfg.indexableLangs === '*' || cfg.indexableLangs.includes(lang);
}

/** Social card source: a generated page card (`/og/{lang}/{key}.png`) or a document card (`/og/{lang}/{kind}/{id}.png`). */
export type CardRef = { key: string } | { kind: string; id: number; v?: string | number };

/**
 * Revision of the card design. It is part of every card URL because shared caches (Cloudflare, messengers) keep a card for up to 30 days:
 * bump it whenever the look of the cards changes so every page points at fresh images.
 */
export const OG_DESIGN = 5;

export function cardUrl(lang: string, card: CardRef): string {
  if ('key' in card) return absolute(`/og/${lang}/${card.key}.png?d=${OG_DESIGN}`);
  return absolute(`/og/${lang}/${card.kind}/${card.id}.png?d=${OG_DESIGN}${card.v ? `&v=${card.v}` : ''}`);
}

export interface MetaInput {
  ctx: Ctx;
  /** path without language prefix, e.g. "/articles/12" ("/" for home) */
  path: string;
  title: string;
  /** use the title as is (home page) instead of "title | site" */
  absoluteTitle?: boolean;
  description?: string | null;
  card?: CardRef;
  /** explicit absolute image URL (primary image for Open Graph and Twitter) */
  image?: string | null;
  imageAlt?: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageType?: string | null;
  type?: 'website' | 'article' | 'book' | 'video' | 'profile';
  /** languages in which this exact page is complete (for hreflang). Defaults to the UI-ready set. */
  readyLangs?: string[];
  /** true when the visitor's language is only partially available on this page → noindex */
  incomplete?: boolean;
  /** extra RSS feed to advertise next to the site feed, e.g. `topic-54` or `author-146` (file name without .xml) */
  feed?: { file: string; title: string };
  noindex?: boolean;
  /** archive page number (≥2 gets its own canonical + title suffix and no hreflang cluster) */
  page?: number;
  pageLabel?: string;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: { name: string; url: string }[];
  section?: string | null;
  tags?: string[];
  isbn?: string | null;
  /** embeddable player URL (type 'video') */
  videoUrl?: string | null;
  extra?: Metadata['other'];
}

export async function buildMetadata(m: MetaInput): Promise<Metadata> {
  const { ctx, path } = m;
  const lang = ctx.lang.code;
  const site = await getSite(lang);
  const siteName = site.shortName || site.name;
  const page = m.page && m.page > 1 ? m.page : 1;
  const ready = (m.readyLangs ?? uiReadyLangs()).filter((c) => isIndexable(c) || c === 'ar');
  const url = (code: string) => absolute(`/${code}${path === '/' ? '' : path}`);
  const self = page > 1 ? `${url(lang)}?page=${page}` : url(lang);
  const languages: Record<string, string> = {};
  if (page === 1) {
    for (const code of ready) languages[getLanguage(code)?.tag ?? code] = url(code);
    languages['x-default'] = url('ar');
  }
  const staging = !isProductionSite();
  const noindex = Boolean(staging || m.noindex || m.incomplete || !isIndexable(lang));
  const baseTitle = m.absoluteTitle ? clip(m.title, 70) : titlePart(withPage(m.title, page, m.pageLabel ?? String(page)));
  const description = describe(m.description, site.description, site.tagline);
  const cardImage = cardUrl(lang, m.card ?? { key: 'home' });
  const imageAlt = clip(m.imageAlt ?? `${m.title} — ${site.name}`, 200);

  // If a direct content image is provided (book cover, news photo, etc.), it is the primary og:image.
  // The branded 1200×630 canvas card is included as secondary image for landscape card pickers.
  const ogImages = m.image
    ? [
        {
          url: m.image,
          alt: imageAlt,
          ...(m.imageWidth ? { width: m.imageWidth } : {}),
          ...(m.imageHeight ? { height: m.imageHeight } : {}),
          type: m.imageType || mimeTypeOf(m.image),
        },
        {
          url: cardImage,
          width: 1200,
          height: 630,
          alt: imageAlt,
          type: 'image/png',
        },
      ]
    : [
        {
          url: cardImage,
          width: 1200,
          height: 630,
          alt: imageAlt,
          type: 'image/png',
        },
      ];

  const twitterImage = m.image ?? cardImage;
  const handle = twitterHandle(site.social?.x);
  const ogType = m.type ?? 'website';
  const og = {
    title: socialTitle(m.title),
    description: description || undefined,
    url: self,
    siteName: site.name,
    locale: ctx.lang.og,
    alternateLocale: ready.filter((c) => c !== lang).map((c) => getLanguage(c)?.og ?? c),
    images: ogImages,
  };
  return {
    title: m.absoluteTitle ? { absolute: baseTitle } : baseTitle,
    description: description || undefined,
    alternates: {
      canonical: noindex && lang !== 'ar' ? url('ar') : self,
      languages,
      types: {
        'application/rss+xml': [
          ...(m.feed ? [{ url: absolute(`/feeds/${lang}/${m.feed.file}.xml`), title: m.feed.title }] : []),
          { url: absolute(`/feeds/${lang}/all.xml`), title: siteName },
        ],
      },
    },
    robots: staging
      ? { index: false, follow: false, noarchive: true }
      : noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    openGraph:
      ogType === 'article'
        ? { ...og, type: 'article', publishedTime: isoOrUndefined(m.publishedTime), modifiedTime: isoOrUndefined(m.modifiedTime), authors: m.authors?.map((a) => a.url), section: m.section ?? undefined, tags: m.tags }
        : ogType === 'book'
          ? { ...og, type: 'book', authors: m.authors?.map((a) => a.url), isbn: m.isbn ?? undefined, releaseDate: isoOrUndefined(m.publishedTime), tags: m.tags }
          : ogType === 'video' && m.videoUrl
            ? { ...og, type: 'video.other', videos: [{ url: m.videoUrl, secureUrl: m.videoUrl, type: 'text/html', width: 1280, height: 720 }] }
            : ogType === 'profile'
              ? { ...og, type: 'profile' }
              : { ...og, type: 'website' },
    twitter: { card: 'summary_large_image', title: og.title, description: description || undefined, images: [{ url: twitterImage, alt: imageAlt }], ...(handle ? { site: handle } : {}) },
    other: m.extra,
  };
}
