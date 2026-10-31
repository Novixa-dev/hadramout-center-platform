import { cache } from 'react';
import { isNotFound, isPlausibleId } from './errors.ts';
import type { Where } from 'payload';
import { getPayloadClient } from './runtime.ts';
import { makeT } from '../i18n/t.ts';
import type { Page } from '../payload-types.ts';
import { CONTENT, type ContentType, type CollectionSlug } from './content-types.ts';

/** Loosely-typed document as returned by Payload for the public site. */
export interface Doc {
  id: number;
  title: string;
  excerpt?: string | null;
  body?: string | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
  cover?: {
    id: number;
    url?: string | null;
    width?: number | null;
    height?: number | null;
    mimeType?: string | null;
    sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null; mimeType?: string | null }>;
  } | number | null;
  status: string;
  publishedAt?: string | null;
  datePrecision?: string | null;
  featured?: boolean | null;
  legacyId?: number | null;
  authors?: ({ id: number; name: string } | number)[] | null;
  category?: { id: number; name: string } | number | null;
  magazine?: ({ id: number; title: string; issueNumber?: number | null; season?: string | null } | number) | null;
  translationMeta?: Record<string, Record<string, unknown>> | null;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface TrInfo {
  lang: string;
  /** 'source' for Arabic */
  status: 'source' | 'complete' | 'partial' | 'missing';
  titleLang: string;
  bodyLang: string;
  excerptLang: string;
  machine: boolean;
  reviewed: boolean;
  stale: boolean;
}

/** Which text of a document is really in `lang` (the rest fell back to Arabic). */
export function trInfo(doc: Pick<Doc, 'translationMeta' | 'body'>, lang: string): TrInfo {
  if (lang === 'ar') return { lang, status: 'source', titleLang: 'ar', bodyLang: 'ar', excerptLang: 'ar', machine: false, reviewed: false, stale: false };
  const m = (doc.translationMeta?.[lang] ?? {}) as Record<string, { q?: string; stale?: boolean } | undefined>;
  const has = (f: string) => Boolean(m[f]);
  const hasBody = Boolean(doc.body);
  const complete = has('title') && (!hasBody || has('body'));
  const any = Object.keys(m).length > 0;
  const q = Object.values(m).map((v) => v?.q);
  const stale = Object.values(m).some((v) => Boolean(v?.stale));
  return {
    lang,
    status: complete ? 'complete' : any ? 'partial' : 'missing',
    titleLang: has('title') ? lang : 'ar',
    excerptLang: has('excerpt') || has('body') ? lang : 'ar',
    bodyLang: has('body') ? lang : 'ar',
    machine: q.includes('auto'),
    reviewed: q.length > 0 && q.every((x) => x !== 'auto'),
    stale,
  };
}

const PUBLISHED: Where = { status: { equals: 'published' } };

export type SortKey = 'newest' | 'oldest' | 'title';

export interface ListParams {
  type: ContentType;
  lang: string;
  page?: number;
  limit?: number;
  sort?: SortKey;
  year?: number;
  categoryId?: number;
  authorId?: number;
  magazineId?: number;
  featured?: boolean;
  when?: 'upcoming' | 'past';
  depth?: number;
}

export interface ListResult {
  docs: Doc[];
  total: number;
  pages: number;
  page: number;
}

function sortField(type: ContentType, sort: SortKey | undefined): string {
  if (type === 'magazine') return sort === 'oldest' ? 'issueNumber' : '-issueNumber';
  if (type === 'event' || type === 'forum') return sort === 'oldest' ? 'eventDate' : '-eventDate';
  if (sort === 'oldest') return 'publishedAt';
  if (sort === 'title') return 'title';
  return '-publishedAt';
}

export async function listDocs(p: ListParams): Promise<ListResult> {
  const payload = await getPayloadClient();
  const slug = CONTENT[p.type].slug;
  const and: Where[] = [PUBLISHED];
  if (p.year) and.push({ publishedAt: { greater_than_equal: `${p.year}-01-01`, less_than_equal: `${p.year}-12-31` } });
  if (p.categoryId) and.push({ category: { equals: p.categoryId } });
  if (p.authorId) and.push({ authors: { contains: p.authorId } });
  if (p.magazineId) and.push({ magazine: { equals: p.magazineId } });
  if (p.featured !== undefined) and.push({ featured: { equals: p.featured } });
  if (p.when) {
    const today = new Date().toISOString().slice(0, 10);
    and.push({ eventDate: p.when === 'upcoming' ? { greater_than_equal: today } : { less_than: today } });
  }
  const res = await payload.find({
    collection: slug,
    where: { and },
    sort: sortField(p.type, p.sort),
    limit: p.limit ?? 12,
    page: p.page ?? 1,
    depth: p.depth ?? 1,
    locale: p.lang as never,
    fallbackLocale: 'ar',
    overrideAccess: false,
    // list cards never need the (large) body
    select: { body: false } as never,
  });
  return { docs: res.docs as unknown as Doc[], total: res.totalDocs, pages: res.totalPages, page: res.page ?? 1 };
}

export const getDoc = cache(async (type: ContentType, id: number, lang: string): Promise<Doc | null> => {
  if (!isPlausibleId(id)) return null;
  const payload = await getPayloadClient();
  try {
    const doc = await payload.findByID({ collection: CONTENT[type].slug, id, depth: 2, locale: lang as never, fallbackLocale: 'ar', overrideAccess: false });
    return doc as unknown as Doc;
  } catch (err) {
    // only a missing document is a 404; a database failure must surface as a 5xx so it is retried and never cached as "gone"
    if (isNotFound(err)) return null;
    throw err;
  }
});

export async function getDocsByIds(slug: CollectionSlug, ids: number[], lang: string, opts: { light?: boolean } = {}): Promise<Doc[]> {
  if (ids.length === 0) return [];
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: slug,
    where: { and: [PUBLISHED, { id: { in: ids } }] },
    limit: ids.length,
    depth: 1,
    locale: lang as never,
    fallbackLocale: 'ar',
    pagination: false,
    // list cards never need the (large) body
    ...(opts.light ? { select: { body: false } as never } : {}),
  });
  const map = new Map((res.docs as unknown as Doc[]).map((d) => [d.id, d]));
  return ids.map((id) => map.get(id)).filter((d): d is Doc => Boolean(d));
}

export async function countByType(): Promise<Record<ContentType, number>> {
  const payload = await getPayloadClient();
  const out = {} as Record<ContentType, number>;
  await Promise.all(
    (Object.keys(CONTENT) as ContentType[]).map(async (t) => {
      out[t] = (await payload.count({ collection: CONTENT[t].slug, where: PUBLISHED })).totalDocs;
    }),
  );
  return out;
}

export async function yearsFor(type: ContentType): Promise<number[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: CONTENT[type].slug, where: { and: [PUBLISHED, { publishedAt: { exists: true } }] }, limit: 5000, depth: 0, pagination: false, select: { publishedAt: true } as never, locale: 'ar' });
  return [...new Set((res.docs as unknown as { publishedAt?: string }[]).map((d) => Number(d.publishedAt?.slice(0, 4))).filter(Boolean))].sort((a, b) => b - a);
}

export async function getPage(slug: string, lang: string, opts: { draft?: boolean } = {}): Promise<Page | null> {
  const payload = await getPayloadClient();
  const where: Where = opts.draft ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] };
  const res = await payload.find({ collection: 'pages', where, limit: 1, depth: 1, locale: lang as never, fallbackLocale: 'ar', overrideAccess: Boolean(opts.draft) });
  return ((res.docs[0] as unknown as Page) || undefined) ?? null;
}

export interface SiteInfo {
  name: string;
  shortName?: string;
  tagline?: string;
  description?: string;
  address?: string;
  email?: string;
  whatsapp?: { label?: string; number: string }[];
  social?: Record<string, string | undefined>;
  reviewsEnabled?: boolean | null;
  translationMeta?: Doc['translationMeta'];
}

/**
 * Site settings in `lang`. Until an editor (or the translation job) provides the institution's name in a language, the
 * CMS falls back to Arabic; page titles, headers and social cards then show the official English name from the UI
 * strings instead of an Arabic name inside an English sentence.
 */
export const getSite = cache(async (lang: string): Promise<SiteInfo> => {
  const payload = await getPayloadClient();
  const site = (await payload.findGlobal({ slug: 'site', locale: lang as never, fallbackLocale: 'ar', depth: 0 })) as unknown as SiteInfo;
  if (lang === 'ar') return site;
  const own = (site.translationMeta?.[lang] ?? {}) as Record<string, unknown>;
  const t = makeT(lang);
  return { ...site, name: own.name ? site.name : t('site.name'), shortName: own.shortName ? site.shortName : t('site.short') };
});

export async function getAuthor(id: number, lang: string) {
  if (!isPlausibleId(id)) return null;
  const payload = await getPayloadClient();
  try {
    return (await payload.findByID({ collection: 'authors', id, depth: 0, locale: lang as never, fallbackLocale: 'ar' })) as unknown as { id: number; name: string; bio?: string | null };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export interface TimelineEntry {
  id: number;
  title: string;
  body?: string | null;
  era?: string | null;
  yearFrom: number;
  yearTo?: number | null;
  source?: string | null;
  sourceUrl?: string | null;
  relatedArticle?: number | null;
  reviewStatus?: 'pending' | 'reviewed' | null;
  reviewedAt?: string | null;
}

export async function listTimeline(lang: string): Promise<TimelineEntry[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: 'timeline', where: { status: { equals: 'published' } }, sort: 'yearFrom', limit: 500, pagination: false, depth: 0, locale: lang as never, fallbackLocale: 'ar' });
  return res.docs as unknown as TimelineEntry[];
}

export interface AnnouncementDoc {
  id: number;
  title: string;
  pinned?: boolean;
  body?: string | null;
  attachmentUrl?: string | null;
  attachment?: { url?: string | null } | number | null;
  eventDate?: string | null;
  expiresAt?: string | null;
  publishedAt?: string | null;
}

export async function listActiveAnnouncements(lang: string): Promise<AnnouncementDoc[]> {
  const payload = await getPayloadClient();
  const now = new Date().toISOString();
  try {
    const res = await payload.find({
      collection: 'announcements',
      where: {
        and: [
          PUBLISHED,
          { pinned: { equals: true } },
          {
            or: [
              { expiresAt: { exists: false } },
              { expiresAt: { greater_than: now } },
            ],
          },
        ],
      },
      limit: 3,
      locale: lang as never,
      fallbackLocale: 'ar',
      depth: 1,
    });
    return res.docs as unknown as AnnouncementDoc[];
  } catch {
    return [];
  }
}

export interface AudioDoc {
  id: number;
  title: string;
  audioUrl?: string | null;
  audioFile?: { url?: string | null } | number | null;
  presenter?: string | null;
  program?: string | null;
  duration?: string | null;
  cover?: { url?: string | null } | number | null;
  body?: string | null;
  publishedAt?: string | null;
}

export async function listAudio(lang: string, limit = 20): Promise<AudioDoc[]> {
  const payload = await getPayloadClient();
  try {
    const res = await payload.find({
      collection: 'audio',
      where: PUBLISHED,
      sort: '-publishedAt',
      limit,
      locale: lang as never,
      fallbackLocale: 'ar',
      depth: 1,
    });
    return res.docs as unknown as AudioDoc[];
  } catch {
    return [];
  }
}

export interface PartnerDoc {
  id: number;
  name: string;
  category?: 'academic' | 'research' | 'cultural' | 'governmental' | null;
  description?: string | null;
  logo?: { url?: string | null } | number | null;
  logoUrl?: string | null;
  website?: string | null;
  order?: number | null;
  hasWrittenConsent?: boolean | null;
}

export interface TestimonialDoc {
  id: number;
  personName: string;
  personTitle?: string | null;
  institution?: string | null;
  quote: string;
  avatar?: { url?: string | null } | number | null;
  avatarUrl?: string | null;
  context?: string | null;
  hasWrittenConsent?: boolean | null;
}

export async function listApprovedPartners(lang: string, limit = 50): Promise<PartnerDoc[]> {
  const payload = await getPayloadClient();
  try {
    const res = await payload.find({
      collection: 'partners',
      where: {
        and: [
          PUBLISHED,
          { hasWrittenConsent: { equals: true } },
        ],
      },
      sort: 'order',
      limit,
      locale: lang as never,
      fallbackLocale: 'ar',
      depth: 1,
    });
    return res.docs as unknown as PartnerDoc[];
  } catch {
    return [];
  }
}

export async function listApprovedTestimonials(lang: string, limit = 20): Promise<TestimonialDoc[]> {
  const payload = await getPayloadClient();
  try {
    const res = await payload.find({
      collection: 'testimonials',
      where: {
        and: [
          PUBLISHED,
          { hasWrittenConsent: { equals: true } },
        ],
      },
      sort: '-createdAt',
      limit,
      locale: lang as never,
      fallbackLocale: 'ar',
      depth: 1,
    });
    return res.docs as unknown as TestimonialDoc[];
  } catch {
    return [];
  }
}



export interface NavPageDoc {
  id: number;
  slug: string;
  title: string;
  navLabel?: string | null;
  navPlacement: 'primary' | 'dropdown' | 'footer_about' | 'footer_explore';
  navOrder: number;
}

export async function listNavPages(lang: string): Promise<NavPageDoc[]> {
  const payload = await getPayloadClient();
  try {
    const res = await payload.find({
      collection: 'pages',
      where: {
        and: [
          PUBLISHED,
          { navPlacement: { not_equals: 'none' } },
        ],
      },
      sort: 'navOrder',
      limit: 100,
      locale: lang as never,
      fallbackLocale: 'ar',
      depth: 0,
    });
    return (res.docs as unknown as NavPageDoc[]).filter((d) => d.navPlacement && d.navPlacement !== ('none' as never));
  } catch {
    return [];
  }
}
