import { getLanguage, type Language } from '../i18n/languages.ts';
import { makeT, type T } from '../i18n/t.ts';
import { CONTENT, type ContentType } from './content-types.ts';
import { formatDate, formatMonthYear, yearOf } from './dates.ts';
import type { Doc } from './data.ts';
import { loadConfig } from '../config.ts';
import { localizeLegacyMedia } from './legacy-media.ts';

export interface Ctx {
  lang: Language;
  t: T;
  /** localized internal URL: href('/news/5') → '/fr/news/5' */
  href: (path: string, lang?: string) => string;
}

export function isLocale(code: string): boolean {
  return Boolean(getLanguage(code));
}

export function makeCtx(code: string): Ctx {
  const lang = getLanguage(code) ?? (getLanguage('ar') as Language);
  return {
    lang,
    t: makeT(lang.code),
    href: (path, to = lang.code) => `/${to}${path === '/' ? '' : path}`,
  };
}

export const siteUrl = (): string => loadConfig().siteUrl;
/** Absolute URL on this site; values that are already absolute (e.g. YouTube thumbnails) pass through unchanged. */
export const absolute = (path: string): string => (/^https?:\/\//i.test(path) ? path : `${siteUrl()}${path}`);

export function docHref(ctx: Pick<Ctx, 'href'>, type: ContentType, id: number, lang?: string): string {
  return ctx.href(`/${CONTENT[type].route}/${id}`, lang);
}

export interface CoverImage {
  src: string;
  alt: string;
  remote: boolean;
  width?: number;
  height?: number;
  mimeType?: string;
}

/** Best available cover: mirrored upload first, else the legacy remote URL. */
export function coverOf(doc: Doc, size: 'thumb' | 'card' | 'large' = 'card'): CoverImage | null {
  const alt = (doc.coverAlt as string | undefined) || doc.title;
  const c = doc.cover;
  if (c && typeof c === 'object') {
    const s = c.sizes?.[size];
    const url = s?.url ?? c.url;
    if (url) {
      return {
        src: url,
        alt,
        remote: false,
        width: s?.width ?? c.width ?? undefined,
        height: s?.height ?? c.height ?? undefined,
        mimeType: s?.mimeType ?? c.mimeType ?? undefined,
      };
    }
  }
  if (doc.coverUrl) return { src: localizeLegacyMedia(doc.coverUrl), alt, remote: false };
  return null;
}

/** Date text honoring precision; estimated/unknown dates are never displayed. */
export function displayDate(doc: Pick<Doc, 'publishedAt' | 'datePrecision'>, lang: string): string {
  const p = doc.datePrecision;
  if (!doc.publishedAt || p === 'estimated' || p === 'none') return '';
  if (p === 'year') return String(yearOf(doc.publishedAt) ?? '');
  if (p === 'month') return formatMonthYear(doc.publishedAt, lang);
  return formatDate(doc.publishedAt, lang);
}

export const authorsOf = (doc: Doc): { id: number; name: string; honorific?: string | null }[] =>
  (doc.authors ?? []).filter((a): a is { id: number; name: string; honorific?: string | null } => typeof a === 'object');
