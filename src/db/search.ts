import type { Param, Store } from './store.ts';
import { LANGUAGES } from '../i18n/languages.ts';
import { normalizeArabic, stemTokens, stripClitics, toFtsQuery, tokenize } from '../lib/arabic.ts';
import { htmlToText } from '../lib/sanitize.ts';

/**
 * Full-text index over the content, one row per (document, language).
 * rowid = docNumber * 128 + languageSlot, so a document's rows are replaced with an indexed range delete.
 * `kind` is the collection slug; docs of different collections have distinct numeric ids only within
 * their own collection, so the rowid also folds in a collection slot.
 */
const LANG_SLOTS = 128;
const KIND_SLOTS = 16;
const KINDS = ['news', 'articles', 'books', 'magazines', 'events', 'forum-events', 'videos', 'pages'];
const langSlot = new Map(LANGUAGES.map((l, i) => [l.code, i]));

function base(kind: string, docId: number): number {
  const k = Math.max(0, KINDS.indexOf(kind));
  return (docId * KIND_SLOTS + k) * LANG_SLOTS;
}

/**
 * Short-lived result cache. Ranking the whole match set is the expensive part (a query for the Center's own name takes
 * about a second of synchronous CPU), and popular queries repeat, so identical lookups within TTL_MS reuse the result.
 * Every index write clears it, so editors never see stale results for longer than the write itself.
 */
const TTL_MS = 60_000;
const MAX_ENTRIES = 300;
const caches = new WeakMap<Store, Map<string, { at: number; value: unknown }>>();

function cached<T>(db: Store, key: string, compute: () => T, clone: (v: T) => T): T {
  let map = caches.get(db);
  if (!map) caches.set(db, (map = new Map()));
  const hit = map.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return clone(hit.value as T);
  const value = compute();
  if (map.size >= MAX_ENTRIES) map.delete(map.keys().next().value as string); // oldest first (Map keeps insertion order)
  map.set(key, { at: Date.now(), value });
  return clone(value);
}

export const clearSearchCache = (db: Store): void => caches.get(db)?.clear();

export interface IndexText {
  title: string;
  excerpt: string;
  body: string; // plain text
  authors: string;
}

export function removeFromIndex(db: Store, kind: string, docId: number): void {
  clearSearchCache(db);
  const start = base(kind, docId);
  db.run('DELETE FROM search_index WHERE rowid BETWEEN ? AND ?', start, start + LANG_SLOTS - 1);
}

/** Replace all index rows of one document. `byLang` maps language code → its (translated or Arabic) text. */
export function indexDocument(db: Store, kind: string, docId: number, byLang: Record<string, IndexText>): void {
  clearSearchCache(db);
  db.tx(() => {
    removeFromIndex(db, kind, docId);
    for (const [lang, t] of Object.entries(byLang)) {
      if (!t.title) continue;
      const title = normalizeArabic(t.title);
      const excerpt = normalizeArabic(t.excerpt);
      const body = normalizeArabic(t.body);
      const authors = normalizeArabic(t.authors);
      const stems = stemTokens(`${title} ${excerpt} ${body} ${authors}`).join(' ');
      db.run(
        'INSERT INTO search_index (rowid, title, excerpt, body, authors, stems, lang, doc_id, kind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        base(kind, docId) + (langSlot.get(lang) ?? LANG_SLOTS - 1),
        title,
        excerpt,
        body,
        authors,
        stems,
        lang,
        docId,
        kind,
      );
    }
  });
}

export function clearIndex(db: Store): void {
  clearSearchCache(db);
  db.exec('DELETE FROM search_index');
}

export function toIndexText(parts: { title?: unknown; excerpt?: unknown; body?: unknown; authors?: string[] }): IndexText {
  return {
    title: typeof parts.title === 'string' ? parts.title : '',
    excerpt: typeof parts.excerpt === 'string' ? parts.excerpt : '',
    body: typeof parts.body === 'string' ? htmlToText(parts.body) : '',
    authors: (parts.authors ?? []).join(' '),
  };
}

export interface SearchHit {
  id: number;
  kind: string;
  rank: number;
}

export interface SearchOptions {
  q: string;
  lang: string;
  kinds?: string[];
  limit?: number;
  offset?: number;
}

const hasLang = (db: Store, code: string) => (db.get<{ n: number }>('SELECT 1 n FROM search_index WHERE lang = ? LIMIT 1', code)?.n ?? 0) === 1;

export function searchIndex(db: Store, opts: SearchOptions): { hits: SearchHit[]; total: number; lang: string } {
  const match = toFtsQuery(opts.q);
  if (!match) return { hits: [], total: 0, lang: opts.lang };
  const key = ['search', match, opts.lang, (opts.kinds ?? []).join(','), opts.limit ?? 20, opts.offset ?? 0].join('|');
  return cached(db, key, () => runSearch(db, opts, match), (r) => ({ ...r, hits: r.hits.map((h) => ({ ...h })) }));
}

function runSearch(db: Store, opts: SearchOptions, match: string): { hits: SearchHit[]; total: number; lang: string } {
  // Search the visitor's language when it has been indexed, else the Arabic source.
  const lang = opts.lang !== 'ar' && hasLang(db, opts.lang) ? opts.lang : 'ar';
  const params: Param[] = [match, lang];
  let kindSql = '';
  if (opts.kinds?.length) {
    kindSql = ` AND kind IN (${opts.kinds.map(() => '?').join(',')})`;
    params.push(...opts.kinds);
  }
  const total = db.get<{ n: number }>(`SELECT count(*) n FROM search_index WHERE search_index MATCH ? AND lang = ?${kindSql}`, ...params)?.n ?? 0;
  const rows = db.all<{ doc_id: number; kind: string; rank: number }>(
    `SELECT doc_id, kind, bm25(search_index, 10.0, 4.0, 1.0, 5.0, 0.5) AS rank
     FROM search_index WHERE search_index MATCH ? AND lang = ?${kindSql}
     ORDER BY rank LIMIT ? OFFSET ?`,
    ...params,
    Math.min(opts.limit ?? 20, 1000),
    Math.max(opts.offset ?? 0, 0),
  );
  return { hits: rows.map((r) => ({ id: r.doc_id, kind: r.kind, rank: r.rank })), total, lang };
}

/** Number of matching documents per collection (for the result-type facet), independent of any type filter. */
export function searchKindCounts(db: Store, q: string, lang: string): Record<string, number> {
  const match = toFtsQuery(q);
  if (!match) return {};
  return cached(
    db,
    ['kinds', match, lang].join('|'),
    () => {
      const useLang = lang !== 'ar' && hasLang(db, lang) ? lang : 'ar';
      const rows = db.all<{ kind: string; n: number }>('SELECT kind, count(*) AS n FROM search_index WHERE search_index MATCH ? AND lang = ? GROUP BY kind', match, useLang);
      return Object.fromEntries(rows.map((r) => [r.kind, r.n]));
    },
    (r) => ({ ...r }),
  );
}

/** Most frequent recent queries that actually found something (shown when a search finds nothing). */
export function popularQueries(db: Store, limit = 8, days = 60): string[] {
  return db
    .all<{ q: string }>("SELECT q FROM search_queries WHERE results > 0 AND day >= date('now', ?) GROUP BY q ORDER BY sum(count) DESC LIMIT ?", `-${days} days`, limit)
    .map((r) => r.q)
    .filter((q) => q.length >= 2 && q.length <= 40);
}

/** Title-prefix suggestions for the typeahead. */
export function suggestTitles(db: Store, q: string, lang: string, limit = 8): { id: number; kind: string }[] {
  const tokens = tokenize(normalizeArabic(q)).slice(0, 6);
  if (tokens.length === 0) return [];
  const clause = tokens.map((t) => (stripClitics(t) !== t ? `("${t}"* OR "${stripClitics(t)}"*)` : `"${t}"*`)).join(' AND ');
  const useLang = lang !== 'ar' && hasLang(db, lang) ? lang : 'ar';
  return db
    .all<{ doc_id: number; kind: string }>('SELECT doc_id, kind FROM search_index WHERE search_index MATCH ? AND lang = ? ORDER BY bm25(search_index, 10.0, 0, 0, 0, 0) LIMIT ?', `title : (${clause})`, useLang, limit)
    .map((r) => ({ id: r.doc_id, kind: r.kind }));
}

/**
 * A readable excerpt around the first match built from the ORIGINAL text (diacritics and spelling kept).
 * Matching is word-by-word on normalized forms.
 */
export function snippetFor(plain: string, q: string, radius = 16): { words: string[]; marks: Set<number>; before: boolean; after: boolean } {
  const words = plain.split(/\s+/).filter(Boolean);
  const wanted = tokenize(normalizeArabic(q)).flatMap((t) => (stripClitics(t) !== t ? [t, stripClitics(t)] : [t]));
  const marks = new Set<number>();
  let first = -1;
  words.forEach((w, i) => {
    const n = normalizeArabic(w).replace(/[^\p{L}\p{N}]/gu, '');
    if (n && wanted.some((t) => n.startsWith(t) || stripClitics(n).startsWith(t))) {
      marks.add(i);
      if (first < 0) first = i;
    }
  });
  const start = Math.max(0, (first < 0 ? 0 : first) - Math.floor(radius / 3));
  const end = Math.min(words.length, start + radius);
  return {
    words: words.slice(start, end),
    marks: new Set([...marks].filter((i) => i >= start && i < end).map((i) => i - start)),
    before: start > 0,
    after: end < words.length,
  };
}
