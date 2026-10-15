/**
 * Pure faceting logic for the archive lists (no database or framework imports, unit-tested).
 *
 * The whole archive is small (≈1,500 documents), so each content type keeps one compact in-memory row per document.
 * Filtering, sorting, counting and "related" lookups then cost microseconds and facet counts are exact —
 * a count shown next to a filter option is the number of results you would get by choosing it.
 */

export interface Row {
  id: number;
  /** Arabic title, used for sorting and as a tiebreaker */
  title: string;
  /** ISO date used for ordering (publication date, or event date for events) */
  date: string | null;
  year: number | null;
  category: number | null;
  authors: number[];
  magazine: number | null;
  /** issue number (magazines) */
  issue: number | null;
  hasPdf: boolean;
  hasCover: boolean;
  featured: boolean;
}

export interface Filters {
  year?: number;
  /** category ids that match (a topic expands to itself + its sub-categories) */
  categories?: ReadonlySet<number>;
  author?: number;
  magazine?: number;
  pdf?: boolean;
  when?: 'upcoming' | 'past';
  /** restrict to these ids (full-text search result) */
  ids?: ReadonlySet<number>;
  /** YYYY-MM-DD, for `when` */
  today?: string;
}

export type FacetKey = 'year' | 'category' | 'author' | 'pdf' | 'when';
export type Sort = 'newest' | 'oldest' | 'title' | 'relevance';

export function matches(r: Row, f: Filters, skip?: FacetKey): boolean {
  if (f.ids && !f.ids.has(r.id)) return false;
  if (skip !== 'year' && f.year && r.year !== f.year) return false;
  if (skip !== 'category' && f.categories && !(r.category !== null && f.categories.has(r.category))) return false;
  if (skip !== 'author' && f.author && !r.authors.includes(f.author)) return false;
  if (f.magazine && r.magazine !== f.magazine) return false;
  if (skip !== 'pdf' && f.pdf && !r.hasPdf) return false;
  if (skip !== 'when' && f.when) {
    const today = f.today ?? new Date().toISOString().slice(0, 10);
    if (!r.date) return false;
    const d = r.date.slice(0, 10);
    if (f.when === 'upcoming' ? d < today : d >= today) return false;
  }
  return true;
}

export const filterRows = (rows: readonly Row[], f: Filters): Row[] => rows.filter((r) => matches(r, f));

const byDate = (a: Row, b: Row) => (a.date ?? '').localeCompare(b.date ?? '');
const collator = new Intl.Collator('ar', { sensitivity: 'base', numeric: true });

/** Stable sort. Rows without a date go last whatever the direction. `rank` (id → position) orders by relevance. */
export function sortRows(rows: readonly Row[], sort: Sort, rank?: ReadonlyMap<number, number>): Row[] {
  const out = [...rows];
  const dated = (cmp: (a: Row, b: Row) => number) => (a: Row, b: Row) => (a.date && !b.date ? -1 : !a.date && b.date ? 1 : cmp(a, b));
  switch (sort) {
    case 'relevance':
      return out.sort((a, b) => (rank?.get(a.id) ?? 1e9) - (rank?.get(b.id) ?? 1e9) || byDate(b, a));
    case 'oldest':
      return out.sort(dated((a, b) => byDate(a, b) || (a.issue ?? 0) - (b.issue ?? 0) || a.id - b.id));
    case 'title':
      return out.sort((a, b) => collator.compare(a.title, b.title) || a.id - b.id);
    default:
      return out.sort(dated((a, b) => byDate(b, a) || (b.issue ?? 0) - (a.issue ?? 0) || b.id - a.id));
  }
}

export interface Counts {
  years: Map<number, number>;
  categories: Map<number, number>;
  authors: Map<number, number>;
  pdf: number;
  upcoming: number;
  past: number;
}

const bump = (m: Map<number, number>, k: number) => m.set(k, (m.get(k) ?? 0) + 1);

/** Disjunctive facet counts: each facet is counted over the rows that match every OTHER active filter. */
export function countFacets(rows: readonly Row[], f: Filters): Counts {
  const c: Counts = { years: new Map(), categories: new Map(), authors: new Map(), pdf: 0, upcoming: 0, past: 0 };
  const today = f.today ?? new Date().toISOString().slice(0, 10);
  for (const r of rows) {
    if (matches(r, f, 'year') && r.year) bump(c.years, r.year);
    if (matches(r, f, 'category') && r.category !== null) bump(c.categories, r.category);
    if (matches(r, f, 'author')) for (const a of r.authors) bump(c.authors, a);
    if (matches(r, f, 'pdf') && r.hasPdf) c.pdf++;
    if (matches(r, f, 'when') && r.date) {
      if (r.date.slice(0, 10) >= today) c.upcoming++;
      else c.past++;
    }
  }
  return c;
}

// ── topics (categories → sub-categories) ─────────────────────────────────────────────────────────

export interface TopicNode {
  id: number;
  name: string;
  parent: number | null;
  order: number;
  description?: string | null;
  /** documents filed directly under this node */
  own: number;
  /** documents under this node and its children */
  total: number;
  children: TopicNode[];
}

export function buildTopicTree(
  cats: readonly { id: number; name: string; parent: number | null; order?: number | null; description?: string | null }[],
  counts: ReadonlyMap<number, number>,
): { roots: TopicNode[]; byId: Map<number, TopicNode> } {
  const byId = new Map<number, TopicNode>();
  for (const c of cats) byId.set(c.id, { id: c.id, name: c.name, parent: c.parent, order: c.order ?? 100, description: c.description, own: counts.get(c.id) ?? 0, total: counts.get(c.id) ?? 0, children: [] });
  const roots: TopicNode[] = [];
  for (const n of byId.values()) {
    const p = n.parent !== null ? byId.get(n.parent) : undefined;
    if (p && p.parent === null) {
      p.children.push(n);
      p.total += n.own;
    } else roots.push(n);
  }
  const cmp = (a: TopicNode, b: TopicNode) => a.order - b.order || b.total - a.total || collator.compare(a.name, b.name);
  roots.sort(cmp);
  for (const r of roots) r.children.sort((a, b) => b.own - a.own || collator.compare(a.name, b.name));
  return { roots, byId };
}

/** A topic filters by itself and all of its sub-categories; a sub-category by itself only. */
export function categoryScope(id: number, byId: ReadonlyMap<number, TopicNode>): Set<number> {
  const node = byId.get(id);
  if (!node) return new Set([id]);
  return new Set([node.id, ...node.children.map((c) => c.id)]);
}

// ── related / neighbours ─────────────────────────────────────────────────────────────────────────

/** Newest-first neighbours of a document in a date-sorted list: `next` is the newer one, `prev` the older. */
export function neighbours(sortedNewestFirst: readonly Row[], id: number): { newer: Row | null; older: Row | null } {
  const i = sortedNewestFirst.findIndex((r) => r.id === id);
  if (i < 0) return { newer: null, older: null };
  return { newer: sortedNewestFirst[i - 1] ?? null, older: sortedNewestFirst[i + 1] ?? null };
}

/** Related documents by transparent rules: same sub-category first, then shared author, then same issue. Never random. */
export function relatedRows(rows: readonly Row[], base: Row, limit = 4): Row[] {
  const score = (r: Row) => (base.category !== null && r.category === base.category ? 4 : 0) + (r.authors.some((a) => base.authors.includes(a)) ? 3 : 0) + (base.magazine !== null && r.magazine === base.magazine ? 2 : 0);
  return rows
    .filter((r) => r.id !== base.id)
    .map((r) => ({ r, s: score(r) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || byDate(b.r, a.r))
    .slice(0, limit)
    .map((x) => x.r);
}
