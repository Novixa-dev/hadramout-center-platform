import type { Store, Param } from './store.ts';
import { LANGUAGES } from '../i18n/languages.ts';
import { normalizeArabic, stemTokens, toFtsQuery, tokenize, stripClitics } from '../lib/arabic.ts';
import { htmlToText } from '../lib/sanitize.ts';
import type { PostType } from './model.ts';

/**
 * Full-text index. One row per (post, language). The row id encodes both so a
 * post's rows can be replaced with an indexed range delete.
 */
const LANG_SLOTS = 128;
const slotOf = new Map(LANGUAGES.map((l, i) => [l.code, i]));

function rowId(postId: number, lang: string): number {
  return postId * LANG_SLOTS + (slotOf.get(lang) ?? LANG_SLOTS - 1);
}

interface IndexedText {
  title: string;
  excerpt: string;
  body: string;
  authors: string;
}

function put(db: Store, postId: number, type: string, lang: string, t: IndexedText): void {
  const title = normalizeArabic(t.title);
  const excerpt = normalizeArabic(t.excerpt);
  const body = normalizeArabic(t.body);
  const authors = normalizeArabic(t.authors);
  const stems = stemTokens(`${title} ${excerpt} ${body} ${authors}`).join(' ');
  db.run(
    'INSERT INTO search_index (rowid, title, excerpt, body, authors, stems, lang, post_id, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    rowId(postId, lang),
    title,
    excerpt,
    body,
    authors,
    stems,
    lang,
    postId,
    type,
  );
}

export function removeFromIndex(db: Store, postId: number): void {
  db.run('DELETE FROM search_index WHERE rowid BETWEEN ? AND ?', postId * LANG_SLOTS, postId * LANG_SLOTS + LANG_SLOTS - 1);
}

/** (Re)build all index rows for one post: Arabic source + every language with a translated title. */
export function indexPost(db: Store, postId: number): void {
  const row = db.get<{ type: string; status: string; title: string; excerpt: string; body: string }>('SELECT type, status, title, excerpt, body FROM posts WHERE id = ?', postId);
  db.tx(() => {
    removeFromIndex(db, postId);
    if (!row || row.status !== 'published') return;
    const authors = db.all<{ name: string }>('SELECT a.name FROM post_authors pa JOIN authors a ON a.id = pa.author_id WHERE pa.post_id = ?', postId).map((a) => a.name);
    put(db, postId, row.type, 'ar', { title: row.title, excerpt: row.excerpt, body: htmlToText(row.body), authors: authors.join(' ') });

    const tr = db.all<{ lang: string; field: string; text: string }>(
      "SELECT lang, field, text FROM translations WHERE scope = 'post' AND ref = ? AND field IN ('title','excerpt','body')",
      String(postId),
    );
    const byLang = new Map<string, Record<string, string>>();
    for (const t of tr) {
      const m = byLang.get(t.lang) ?? {};
      m[t.field] = t.text;
      byLang.set(t.lang, m);
    }
    for (const [lang, f] of byLang) {
      if (!f.title) continue;
      put(db, postId, row.type, lang, { title: f.title, excerpt: f.excerpt ?? '', body: htmlToText(f.body ?? ''), authors: '' });
    }
  });
}

export function reindexAll(db: Store): number {
  const ids = db.all<{ id: number }>("SELECT id FROM posts WHERE status = 'published'");
  db.tx(() => {
    db.exec('DELETE FROM search_index');
    for (const { id } of ids) indexPost(db, id);
  });
  return ids.length;
}

export interface SearchHit {
  id: number;
  type: PostType;
  rank: number;
}

export interface SearchOptions {
  q: string;
  lang: string;
  types?: PostType[];
  limit?: number;
  offset?: number;
}

export function searchPosts(db: Store, opts: SearchOptions): { hits: SearchHit[]; total: number; lang: string } {
  const match = toFtsQuery(opts.q);
  if (!match) return { hits: [], total: 0, lang: opts.lang };

  // Search in the visitor's language when that language has been indexed, else in the Arabic source.
  const hasLang = (code: string) => (db.get<{ n: number }>('SELECT 1 n FROM search_index WHERE lang = ? LIMIT 1', code)?.n ?? 0) === 1;
  const lang = opts.lang !== 'ar' && hasLang(opts.lang) ? opts.lang : 'ar';

  const params: Param[] = [match, lang];
  let typeSql = '';
  if (opts.types?.length) {
    typeSql = ` AND type IN (${opts.types.map(() => '?').join(',')})`;
    params.push(...opts.types);
  }
  const total = db.get<{ n: number }>(`SELECT count(*) n FROM search_index WHERE search_index MATCH ? AND lang = ?${typeSql}`, ...params)?.n ?? 0;
  const rows = db.all<{ post_id: number; type: PostType; rank: number }>(
    `SELECT post_id, type, bm25(search_index, 10.0, 4.0, 1.0, 5.0, 0.5) AS rank
     FROM search_index WHERE search_index MATCH ? AND lang = ?${typeSql}
     ORDER BY rank LIMIT ? OFFSET ?`,
    ...params,
    Math.min(opts.limit ?? 20, 100),
    Math.max(opts.offset ?? 0, 0),
  );
  return { hits: rows.map((r) => ({ id: r.post_id, type: r.type, rank: r.rank })), total, lang };
}

/** Title-prefix suggestions for the typeahead. */
export function suggestTitles(db: Store, q: string, lang: string, limit = 8): { id: number; type: PostType }[] {
  const tokens = tokenize(normalizeArabic(q)).slice(0, 6);
  if (tokens.length === 0) return [];
  const match = `title : (${tokens.map((t) => (stripClitics(t) !== t ? `("${t}"* OR "${stripClitics(t)}"*)` : `"${t}"*`)).join(' AND ')})`;
  const useLang = lang !== 'ar' && (db.get<{ n: number }>('SELECT 1 n FROM search_index WHERE lang = ? LIMIT 1', lang)?.n ?? 0) === 1 ? lang : 'ar';
  return db
    .all<{ post_id: number; type: PostType }>('SELECT post_id, type FROM search_index WHERE search_index MATCH ? AND lang = ? ORDER BY bm25(search_index, 10.0, 0, 0, 0, 0) LIMIT ?', match, useLang, limit)
    .map((r) => ({ id: r.post_id, type: r.type }));
}

/**
 * Build a readable excerpt around the first match using the ORIGINAL text, so diacritics
 * and spelling are preserved. Matching is done word-by-word on normalized forms.
 */
export function snippetFor(plain: string, q: string, radius = 16): { text: string; marks: Set<number> } {
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
  const slice = words.slice(start, end);
  const shifted = new Set<number>([...marks].filter((i) => i >= start && i < end).map((i) => i - start));
  return {
    text: `${start > 0 ? '… ' : ''}${slice.join(' ')}${end < words.length ? ' …' : ''}`,
    marks: shifted,
  };
}
