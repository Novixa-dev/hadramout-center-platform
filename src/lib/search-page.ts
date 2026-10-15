import { extras } from './extras.ts';
import { popularQueries, searchIndex, searchKindCounts } from '../db/search.ts';
import { COLLECTION_SLUGS, typeFromSlug, type CollectionSlug } from './content-types.ts';
import { countFacets, filterRows, sortRows, type Counts, type Row, type Sort } from './facet-core.ts';
import { getAuthorNames, getRows } from './facets.ts';
import { getDocsByIds, type Doc } from './data.ts';

/**
 * Unified archive search: the FTS5 index finds and ranks documents of every type; the in-memory rows (see facets.ts)
 * supply year/author/date so results can be narrowed and re-sorted with exact facet counts.
 */

export const SEARCH_PER_PAGE = 15;
const MAX_HITS = 1000;

export interface SearchParams {
  q: string;
  lang: string;
  kind?: CollectionSlug;
  year?: number;
  author?: number;
  sort?: Sort;
  page: number;
}

export interface SearchResult {
  total: number;
  /** all matches over every type (before the type filter) */
  kindCounts: Record<string, number>;
  counts: Counts;
  items: { doc: Doc; kind: CollectionSlug }[];
  pages: number;
  page: number;
  usedLang: string;
  authorNames: Map<number, string>;
  popular: string[];
}

export async function runSearch(p: SearchParams): Promise<SearchResult> {
  const db = extras();
  const kinds = p.kind ? [p.kind] : [...COLLECTION_SLUGS];
  const res = searchIndex(db, { q: p.q, lang: p.lang, kinds, limit: MAX_HITS });
  const kindCounts = searchKindCounts(db, p.q, p.lang);

  const types = [...new Set(res.hits.map((h) => typeFromSlug(h.kind)?.type).filter((t): t is NonNullable<ReturnType<typeof typeFromSlug>>['type'] => Boolean(t)))];
  const rowSets = new Map(await Promise.all(types.map(async (t) => [t, new Map((await getRows(t)).map((r) => [r.id, r]))] as const)));
  const authorNames = await getAuthorNames(p.lang);

  // synthetic rows: id = rank position, so ids from different collections never collide
  const hitRows: (Row & { slug: CollectionSlug; docId: number })[] = [];
  res.hits.forEach((h, i) => {
    const t = typeFromSlug(h.kind);
    const row = t ? rowSets.get(t.type)?.get(h.id) : undefined;
    if (!t || !row) return; // unpublished or deleted since indexing
    hitRows.push({ ...row, id: i, slug: h.kind as CollectionSlug, docId: h.id });
  });

  const filters = { year: p.year, author: p.author };
  const matched = filterRows(hitRows, filters) as typeof hitRows;
  const counts = countFacets(hitRows, filters);
  const rank = new Map(hitRows.map((r) => [r.id, r.id]));
  const sorted = sortRows(matched, p.sort ?? 'relevance', rank) as typeof hitRows;

  const pages = Math.max(1, Math.ceil(sorted.length / SEARCH_PER_PAGE));
  const page = Math.min(Math.max(1, p.page), pages);
  const slice = sorted.slice((page - 1) * SEARCH_PER_PAGE, page * SEARCH_PER_PAGE);

  const bySlug = new Map<CollectionSlug, number[]>();
  for (const r of slice) bySlug.set(r.slug, [...(bySlug.get(r.slug) ?? []), r.docId]);
  const loaded = new Map<string, Doc>();
  for (const [slug, ids] of bySlug) for (const d of await getDocsByIds(slug, ids, p.lang)) loaded.set(`${slug}:${d.id}`, d);
  const items = slice.flatMap((r) => {
    const doc = loaded.get(`${r.slug}:${r.docId}`);
    return doc ? [{ doc, kind: r.slug }] : [];
  });

  return { total: sorted.length, kindCounts, counts, items, pages, page, usedLang: res.lang, authorNames, popular: sorted.length === 0 ? popularQueries(db) : [] };
}

/** Best-effort statistics of what visitors look for (used for the "popular searches" hints). */
export function recordSearch(q: string, results: number): void {
  try {
    extras().run("INSERT INTO search_queries (day, q, count, results) VALUES (date('now'), ?, 1, ?) ON CONFLICT(day, q) DO UPDATE SET count = count + 1, results = excluded.results", q.toLowerCase(), results);
  } catch {
    /* statistics are best-effort */
  }
}
