import type { ContentType } from './content-types.ts';
import type { Sort } from './facet-core.ts';

/**
 * URL state of an archive list. Every filter lives in the query string (shareable, back/forward-safe);
 * links are built so that defaults never appear in the URL and unknown/garbled params are ignored.
 */

export type FacetName = 'q' | 'topic' | 'year' | 'author' | 'pdf' | 'when';
export type View = 'grid' | 'list' | 'compact';

export const FACETS: Record<ContentType, readonly FacetName[]> = {
  news: ['q', 'year'],
  article: ['q', 'topic', 'year', 'author'],
  book: ['q', 'year', 'author', 'pdf'],
  magazine: ['q', 'year', 'pdf'],
  event: ['q', 'when', 'year'],
  forum: ['q', 'when', 'year'],
  video: ['q'],
};

/** Facets that need the sidebar (the text search lives in its own bar above the results). */
export const sidebarFacets = (facets: readonly FacetName[]): FacetName[] => facets.filter((f) => f !== 'q');

/** Views a type offers (first = default). */
export const VIEWS: Record<ContentType, readonly View[]> = {
  news: ['grid', 'list'],
  article: ['list', 'compact'],
  book: ['grid', 'list'],
  magazine: ['grid'],
  event: ['list'],
  forum: ['list'],
  video: ['grid'],
};

export const PER_PAGE: Record<ContentType, number> = { news: 12, article: 20, book: 18, magazine: 18, event: 12, forum: 12, video: 12 };
export const COMPACT_PER_PAGE = 40;

export interface ListQuery {
  q?: string;
  year?: number;
  category?: number;
  author?: number;
  pdf?: boolean;
  when?: 'upcoming' | 'past';
  sort?: Sort;
  view: View;
  page: number;
}

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);
const posInt = (v: string | undefined, max = 1e9): number | undefined => {
  if (!v || !/^\d{1,9}$/.test(v)) return undefined;
  const n = Number(v);
  return n > 0 && n <= max ? n : undefined;
};

export function parseListQuery(sp: Raw, type: ContentType): ListQuery {
  const facets = FACETS[type];
  const views = VIEWS[type];
  const q = facets.includes('q') ? one(sp.q)?.replace(/\s+/g, ' ').trim().slice(0, 100) || undefined : undefined;
  const sortRaw = one(sp.sort);
  // "newest" is the default without a text query, so it never counts as a custom sort
  const sort: Sort | undefined = sortRaw === 'oldest' || sortRaw === 'title' || (sortRaw === 'newest' && q) || (sortRaw === 'relevance' && q) ? sortRaw : undefined;
  const viewRaw = one(sp.view) as View | undefined;
  const whenRaw = one(sp.when);
  return {
    q,
    year: facets.includes('year') ? posInt(one(sp.year), 3000) : undefined,
    category: facets.includes('topic') ? posInt(one(sp.category)) : undefined,
    author: facets.includes('author') ? posInt(one(sp.author)) : undefined,
    pdf: facets.includes('pdf') && one(sp.pdf) === '1' ? true : undefined,
    when: facets.includes('when') && (whenRaw === 'upcoming' || whenRaw === 'past') ? whenRaw : undefined,
    sort,
    view: viewRaw && views.includes(viewRaw) ? viewRaw : (views[0] as View),
    page: posInt(one(sp.page), 10_000) ?? 1,
  };
}

/** The sort used when none is chosen: relevance for a text query, soonest-first for upcoming events, else newest. */
export function effectiveSort(q: ListQuery): Sort {
  return q.sort ?? (q.q ? 'relevance' : q.when === 'upcoming' ? 'oldest' : 'newest');
}

export function perPage(type: ContentType, view: View): number {
  return view === 'compact' ? COMPACT_PER_PAGE : PER_PAGE[type];
}

/** Query-string parameters for a ListQuery, omitting defaults. */
export function queryParams(q: ListQuery, type: ContentType, patch: Partial<Record<keyof ListQuery, unknown>> = {}): Record<string, string | undefined> {
  const m = { ...q, ...patch } as ListQuery;
  const defaultView = VIEWS[type][0];
  return {
    q: m.q,
    category: m.category ? String(m.category) : undefined,
    year: m.year ? String(m.year) : undefined,
    author: m.author ? String(m.author) : undefined,
    pdf: m.pdf ? '1' : undefined,
    when: m.when,
    sort: m.sort && m.sort !== (m.q ? 'relevance' : 'newest') ? m.sort : undefined,
    view: m.view !== defaultView ? m.view : undefined,
    page: m.page > 1 ? String(m.page) : undefined,
  };
}

export function toSearch(params: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  const s = u.toString();
  return s ? `?${s}` : '';
}

/** Which user-chosen filters are active (not view/sort/page) — drives chips, the clear button and noindex. */
export function activeFilters(q: ListQuery): FacetName[] {
  const out: FacetName[] = [];
  if (q.q) out.push('q');
  if (q.category) out.push('topic');
  if (q.year) out.push('year');
  if (q.author) out.push('author');
  if (q.pdf) out.push('pdf');
  if (q.when) out.push('when');
  return out;
}

/** True when the URL shows anything other than the plain first page of the default view/sort. */
export function isCustomised(q: ListQuery, type: ContentType): boolean {
  return activeFilters(q).length > 0 || Boolean(q.sort && q.sort !== 'newest') || q.view !== VIEWS[type][0];
}
