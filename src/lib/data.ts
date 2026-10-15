import { cache } from 'react';
import type { Where } from 'payload';
import { getPayloadClient } from './runtime.ts';
import { CONTENT, type ContentType, type CollectionSlug } from './content-types.ts';

/** Loosely-typed document as returned by Payload for the public site. */
export interface Doc {
  id: number;
  title: string;
  excerpt?: string | null;
  body?: string | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
  cover?: { id: number; url?: string | null; sizes?: Record<string, { url?: string | null }> } | number | null;
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
}

/** Which text of a document is really in `lang` (the rest fell back to Arabic). */
export function trInfo(doc: Pick<Doc, 'translationMeta' | 'body'>, lang: string): TrInfo {
  if (lang === 'ar') return { lang, status: 'source', titleLang: 'ar', bodyLang: 'ar', excerptLang: 'ar', machine: false, reviewed: false };
  const m = (doc.translationMeta?.[lang] ?? {}) as Record<string, { q?: string } | undefined>;
  const has = (f: string) => Boolean(m[f]);
  const hasBody = Boolean(doc.body);
  const complete = has('title') && (!hasBody || has('body'));
  const any = Object.keys(m).length > 0;
  const q = Object.values(m).map((v) => v?.q);
  return {
    lang,
    status: complete ? 'complete' : any ? 'partial' : 'missing',
    titleLang: has('title') ? lang : 'ar',
    excerptLang: has('excerpt') || has('body') ? lang : 'ar',
    bodyLang: has('body') ? lang : 'ar',
    machine: q.includes('auto'),
    reviewed: q.length > 0 && q.every((x) => x !== 'auto'),
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
  const payload = await getPayloadClient();
  try {
    const doc = await payload.findByID({ collection: CONTENT[type].slug, id, depth: 2, locale: lang as never, fallbackLocale: 'ar', overrideAccess: false });
    return doc as unknown as Doc;
  } catch {
    return null;
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

export async function getPage(slug: string, lang: string) {
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: 'pages', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] }, limit: 1, depth: 0, locale: lang as never, fallbackLocale: 'ar' });
  return (res.docs[0] as unknown as { id: number; title: string; body?: string; translationMeta?: Doc['translationMeta'] } | undefined) ?? null;
}

export const getSite = cache(async (lang: string) => {
  const payload = await getPayloadClient();
  return (await payload.findGlobal({ slug: 'site', locale: lang as never, fallbackLocale: 'ar', depth: 0 })) as unknown as {
    name: string;
    shortName?: string;
    tagline?: string;
    description?: string;
    address?: string;
    email?: string;
    whatsapp?: { label?: string; number: string }[];
    social?: Record<string, string | undefined>;
    translationMeta?: Doc['translationMeta'];
  };
});

export async function getAuthor(id: number, lang: string) {
  const payload = await getPayloadClient();
  try {
    return (await payload.findByID({ collection: 'authors', id, depth: 0, locale: lang as never, fallbackLocale: 'ar' })) as unknown as { id: number; name: string; bio?: string | null };
  } catch {
    return null;
  }
}

export async function listCategories(lang: string, kind: 'article' | 'book') {
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: 'categories', where: { kind: { equals: kind } }, limit: 200, pagination: false, depth: 0, locale: lang as never, fallbackLocale: 'ar' });
  return res.docs as unknown as { id: number; name: string }[];
}

export async function listTimeline(lang: string) {
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: 'timeline', where: { status: { equals: 'published' } }, sort: 'yearFrom', limit: 200, pagination: false, depth: 0, locale: lang as never, fallbackLocale: 'ar' });
  return res.docs as unknown as { id: number; title: string; body?: string | null; era?: string | null; yearFrom: number; yearTo?: number | null; source?: string | null }[];
}
