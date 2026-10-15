import type { Payload } from 'payload';
import { getPayloadClient } from './runtime.ts';
import { CONTENT, type ContentType } from './content-types.ts';
import { getDocsByIds, type Doc } from './data.ts';
import { extras } from './extras.ts';
import { searchIndex } from '../db/search.ts';
import { normalizeArabic } from './arabic.ts';
import { buildTopicTree, categoryScope, countFacets, filterRows, neighbours, relatedRows, sortRows, type Counts, type Filters, type Row, type Sort, type TopicNode } from './facet-core.ts';

/**
 * Data side of the faceted archive: loads one compact row per published document (cached 5 minutes in memory,
 * dropped immediately when an editor saves content — see hooks/revalidate.ts) and answers list queries with exact counts.
 */

const TTL_MS = 5 * 60 * 1000;
type Cache = Map<string, { at: number; value: Promise<unknown> }>;
const g = globalThis as { __hcFacets?: Cache };
const cache = (): Cache => (g.__hcFacets ??= new Map());

function memo<T>(key: string, make: () => Promise<T>): Promise<T> {
  const hit = cache().get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>;
  const value = make().catch((err) => {
    cache().delete(key);
    throw err;
  });
  cache().set(key, { at: Date.now(), value });
  return value;
}

export function clearFacets(): void {
  g.__hcFacets?.clear();
}

type Raw = Record<string, unknown> & { id: number; title?: string; publishedAt?: string | null; datePrecision?: string | null };
const id = (v: unknown): number | null => (typeof v === 'number' ? v : v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'number' ? (v as { id: number }).id : null);

const SELECT: Record<ContentType, Record<string, true>> = {
  news: { title: true, publishedAt: true, datePrecision: true, cover: true, coverUrl: true, featured: true },
  article: { title: true, publishedAt: true, datePrecision: true, category: true, authors: true, magazine: true, featured: true },
  book: { title: true, publishedAt: true, datePrecision: true, year: true, category: true, authors: true, pdf: true, cover: true, coverUrl: true, featured: true },
  magazine: { title: true, publishedAt: true, datePrecision: true, issueNumber: true, pdf: true, cover: true, coverUrl: true, featured: true },
  event: { title: true, publishedAt: true, datePrecision: true, eventDate: true, cover: true, coverUrl: true, featured: true },
  forum: { title: true, publishedAt: true, datePrecision: true, eventDate: true, cover: true, coverUrl: true, featured: true },
  video: { title: true, publishedAt: true, datePrecision: true, cover: true, coverUrl: true, featured: true },
};

function toRow(type: ContentType, d: Raw): Row {
  const isEvent = type === 'event' || type === 'forum';
  const date = (isEvent ? (d.eventDate as string | undefined) : undefined) ?? d.publishedAt ?? null;
  const dated = d.datePrecision !== 'estimated' && d.datePrecision !== 'none';
  const year = type === 'book' && typeof d.year === 'number' ? d.year : dated && date ? Number(date.slice(0, 4)) || null : null;
  const authors = Array.isArray(d.authors) ? d.authors.map(id).filter((x): x is number => x !== null) : [];
  return {
    id: d.id,
    title: String(d.title ?? ''),
    date,
    year,
    category: id(d.category),
    authors,
    magazine: id(d.magazine),
    issue: typeof d.issueNumber === 'number' ? d.issueNumber : null,
    hasPdf: typeof d.pdf === 'string' && d.pdf.length > 0,
    hasCover: Boolean(d.cover || d.coverUrl),
    featured: Boolean(d.featured),
  };
}

export function getRows(type: ContentType): Promise<Row[]> {
  return memo(`rows:${type}`, async () => {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: CONTENT[type].slug,
      where: { status: { equals: 'published' } },
      limit: 5000,
      pagination: false,
      depth: 0,
      locale: 'ar',
      select: SELECT[type] as never,
    });
    return (res.docs as unknown as Raw[]).map((d) => toRow(type, d));
  });
}

// ── topics ────────────────────────────────────────────────────────────────────────────────────────

export interface Topics {
  roots: TopicNode[];
  byId: Map<number, TopicNode>;
  /** documents without a category */
  uncategorised: number;
}

export function getTopics(lang: string): Promise<Topics> {
  return memo(`topics:${lang}`, async () => {
    const payload: Payload = await getPayloadClient();
    const [cats, rows] = await Promise.all([
      payload.find({ collection: 'categories', where: { kind: { equals: 'article' } }, limit: 500, pagination: false, depth: 0, locale: lang as never, fallbackLocale: 'ar' }),
      getRows('article'),
    ]);
    const counts = new Map<number, number>();
    let uncategorised = 0;
    for (const r of rows) {
      if (r.category === null) uncategorised++;
      else counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    }
    const list = (cats.docs as unknown as { id: number; name: string; parent?: unknown; order?: number | null; description?: string | null }[]).map((c) => ({ id: c.id, name: c.name, parent: id(c.parent), order: c.order, description: c.description }));
    const tree = buildTopicTree(list, counts);
    return { ...tree, uncategorised };
  });
}

// ── authors ───────────────────────────────────────────────────────────────────────────────────────

export interface AuthorSummary {
  id: number;
  name: string;
  count: number;
  articles: number;
  books: number;
}

export function getAuthorNames(lang: string): Promise<Map<number, string>> {
  return memo(`authors:${lang}`, async () => {
    const payload = await getPayloadClient();
    const res = await payload.find({ collection: 'authors', limit: 5000, pagination: false, depth: 0, locale: lang as never, fallbackLocale: 'ar', sort: 'nameKey', select: { name: true } as never });
    return new Map((res.docs as unknown as { id: number; name: string }[]).map((a) => [a.id, a.name]));
  });
}

/** Authors with at least one published article or book, with counts. Names are filtered accent/hamza-insensitively. */
export async function listAuthors(lang: string, q?: string): Promise<AuthorSummary[]> {
  const [names, articles, books] = await Promise.all([getAuthorNames(lang), getRows('article'), getRows('book')]);
  const counts = new Map<number, { articles: number; books: number }>();
  const add = (rows: Row[], k: 'articles' | 'books') => {
    for (const r of rows) for (const a of r.authors) counts.set(a, { ...(counts.get(a) ?? { articles: 0, books: 0 }), [k]: (counts.get(a)?.[k] ?? 0) + 1 });
  };
  add(articles, 'articles');
  add(books, 'books');
  const needle = q ? normalizeArabic(q) : '';
  const out: AuthorSummary[] = [];
  for (const [aid, c] of counts) {
    const name = names.get(aid);
    if (!name) continue;
    if (needle && !normalizeArabic(name).includes(needle)) continue;
    out.push({ id: aid, name, count: c.articles + c.books, articles: c.articles, books: c.books });
  }
  const collator = new Intl.Collator(lang === 'ar' ? 'ar' : lang, { sensitivity: 'base' });
  return out.sort((a, b) => collator.compare(a.name, b.name));
}

// ── list queries ──────────────────────────────────────────────────────────────────────────────────

export interface ArchiveQuery {
  type: ContentType;
  lang: string;
  q?: string;
  year?: number;
  category?: number;
  author?: number;
  magazineId?: number;
  pdf?: boolean;
  when?: 'upcoming' | 'past';
  sort?: Sort;
  page?: number;
  limit?: number;
}

export interface ArchiveResult {
  docs: Doc[];
  total: number;
  pages: number;
  page: number;
  sort: Sort;
  counts: Counts;
  /** size of the unfiltered set */
  all: number;
  topics: Topics | null;
  authorNames: Map<number, string>;
}

export async function queryArchive(p: ArchiveQuery): Promise<ArchiveResult> {
  const info = CONTENT[p.type];
  const [rows, topics, authorNames] = await Promise.all([getRows(p.type), p.type === 'article' ? getTopics(p.lang) : Promise.resolve(null), p.type === 'article' || p.type === 'book' ? getAuthorNames(p.lang) : Promise.resolve(new Map<number, string>())]);

  let rank: Map<number, number> | undefined;
  let ids: Set<number> | undefined;
  const q = p.q?.trim();
  if (q) {
    const hits = searchIndex(extras(), { q, lang: p.lang, kinds: [info.slug], limit: 1000 }).hits;
    rank = new Map(hits.map((h, i) => [h.id, i]));
    ids = new Set(rank.keys());
  }
  const filters: Filters = {
    year: p.year,
    categories: p.category && topics ? categoryScope(p.category, topics.byId) : undefined,
    author: p.author,
    magazine: p.magazineId,
    pdf: p.pdf,
    when: p.when,
    ids,
  };
  const sort: Sort = p.sort ?? (q ? 'relevance' : 'newest');
  const sorted = sortRows(filterRows(rows, filters), sort, rank);
  const limit = p.limit ?? 12;
  const pages = Math.max(1, Math.ceil(sorted.length / limit));
  const page = Math.min(Math.max(1, p.page ?? 1), pages);
  const slice = sorted.slice((page - 1) * limit, page * limit).map((r) => r.id);
  const docs = await getDocsByIds(info.slug, slice, p.lang, { light: true });
  return { docs, total: sorted.length, pages, page, sort, counts: countFacets(rows, filters), all: rows.length, topics, authorNames };
}

/** Previous/next documents of a type in publication order (newest first), plus rule-based related documents. */
export async function neighboursAndRelated(type: ContentType, docId: number): Promise<{ newer: Row | null; older: Row | null; related: Row[] }> {
  const rows = await getRows(type);
  const sorted = sortRows(rows, 'newest');
  const base = rows.find((r) => r.id === docId);
  return { ...neighbours(sorted, docId), related: base ? relatedRows(rows, base, 4) : [] };
}

/** Counts per author/year etc. are cheap; the home page and hub pages also need plain totals. */
export async function rowCount(type: ContentType): Promise<number> {
  return (await getRows(type)).length;
}

/** Newest (or soonest/oldest) documents of a type without any filtering — home page blocks and "more like this" lists. */
export async function latest(type: ContentType, lang: string, limit: number, opts: { when?: 'upcoming' | 'past'; sort?: Sort; withCover?: boolean } = {}): Promise<Doc[]> {
  const rows = await getRows(type);
  let filtered = filterRows(rows, { when: opts.when });
  if (opts.withCover) filtered = filtered.filter((r) => r.hasCover);
  const ids = sortRows(filtered, opts.sort ?? 'newest')
    .slice(0, limit)
    .map((r) => r.id);
  return getDocsByIds(CONTENT[type].slug, ids, lang, { light: true });
}

/** Authors ordered by number of works (home page "most published"). */
export async function topAuthors(lang: string, limit: number): Promise<AuthorSummary[]> {
  return (await listAuthors(lang)).sort((a, b) => b.count - a.count).slice(0, limit);
}
