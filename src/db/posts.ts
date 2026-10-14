import type { Store, Param } from './store.ts';
import { rowToPost, type AuthorRef, type Post, type PostInput, type PostRow, type PostStatus, type PostType, type TermRef } from './model.ts';
import { authorKey, splitAuthors } from '../lib/arabic.ts';
import { sanitizeBody, sanitizeText, excerptFrom } from '../lib/sanitize.ts';

/** Columns used by list views — the (large) body is deliberately excluded. */
const LIST_COLUMNS = `p.id, p.type, p.status, p.title, p.excerpt, '' AS body, p.cover, p.cover_alt, p.published_at, p.date_precision,
  p.fields, p.data, p.featured, p.views, p.legacy_url, p.source, p.edited, p.created_at, p.updated_at`;
const FULL_COLUMNS = `p.id, p.type, p.status, p.title, p.excerpt, p.body, p.cover, p.cover_alt, p.published_at, p.date_precision,
  p.fields, p.data, p.featured, p.views, p.legacy_url, p.source, p.edited, p.created_at, p.updated_at`;

export type PostOrder = 'newest' | 'oldest' | 'title' | 'popular' | 'issue';

export interface ListOptions {
  types?: PostType[];
  status?: PostStatus | 'any';
  q?: string;
  authorId?: number;
  termId?: number;
  year?: number;
  magazineId?: number;
  featured?: boolean;
  /** events: 'upcoming' = event_date >= today, 'past' = before today */
  when?: 'upcoming' | 'past';
  order?: PostOrder;
  limit?: number;
  offset?: number;
  withBody?: boolean;
  excludeId?: number;
}

export interface ListResult {
  posts: Post[];
  total: number;
}

function orderSql(order: PostOrder | undefined, types: PostType[] | undefined): string {
  switch (order) {
    case 'oldest':
      return 'p.published_at ASC, p.id ASC';
    case 'title':
      return 'p.title COLLATE NOCASE ASC';
    case 'popular':
      return 'p.views DESC, p.published_at DESC';
    case 'issue':
      return "CAST(json_extract(p.data,'$.issue_number') AS INTEGER) DESC, p.id DESC";
    default:
      // newest: undated rows last; id breaks ties so paging is stable
      return types?.length === 1 && types[0] === 'magazine'
        ? "CAST(json_extract(p.data,'$.issue_number') AS INTEGER) DESC, p.id DESC"
        : 'p.published_at DESC, p.id DESC';
  }
}

export function loadRelations(db: Store, posts: Post[]): Post[] {
  if (posts.length === 0) return posts;
  const ids = posts.map((p) => p.id);
  const marks = ids.map(() => '?').join(',');
  const authors = db.all<{ post_id: number; id: number; name: string }>(
    `SELECT pa.post_id, a.id, a.name FROM post_authors pa JOIN authors a ON a.id = pa.author_id WHERE pa.post_id IN (${marks}) ORDER BY pa.position`,
    ...ids,
  );
  const terms = db.all<{ post_id: number; id: number; taxonomy: string; name: string }>(
    `SELECT pt.post_id, t.id, t.taxonomy, t.name FROM post_terms pt JOIN terms t ON t.id = pt.term_id WHERE pt.post_id IN (${marks})`,
    ...ids,
  );
  const byId = new Map(posts.map((p) => [p.id, p]));
  for (const a of authors) byId.get(a.post_id)?.authors.push({ id: a.id, name: a.name } satisfies AuthorRef);
  for (const t of terms) byId.get(t.post_id)?.terms.push({ id: t.id, taxonomy: t.taxonomy, name: t.name } satisfies TermRef);
  return posts;
}

export function getPost(db: Store, id: number, opts: { status?: PostStatus | 'any' } = {}): Post | null {
  const status = opts.status ?? 'published';
  const row = db.get<PostRow>(`SELECT ${FULL_COLUMNS} FROM posts p WHERE p.id = ? ${status === 'any' ? '' : 'AND p.status = ?'}`, ...(status === 'any' ? [id] : [id, status]));
  if (!row) return null;
  return loadRelations(db, [rowToPost(row)])[0] ?? null;
}

export function listPosts(db: Store, opts: ListOptions = {}): ListResult {
  const where: string[] = [];
  const params: Param[] = [];
  const joins: string[] = [];

  const status = opts.status ?? 'published';
  if (status !== 'any') {
    where.push('p.status = ?');
    params.push(status);
  }
  if (opts.types?.length) {
    where.push(`p.type IN (${opts.types.map(() => '?').join(',')})`);
    params.push(...opts.types);
  }
  if (opts.authorId) {
    joins.push('JOIN post_authors pa ON pa.post_id = p.id');
    where.push('pa.author_id = ?');
    params.push(opts.authorId);
  }
  if (opts.termId) {
    joins.push('JOIN post_terms pt ON pt.post_id = p.id');
    where.push('pt.term_id = ?');
    params.push(opts.termId);
  }
  if (opts.year) {
    where.push("substr(p.published_at,1,4) = ?");
    params.push(String(opts.year));
  }
  if (opts.magazineId) {
    where.push("json_extract(p.data,'$.magazine_id') = ?");
    params.push(opts.magazineId);
  }
  if (opts.featured !== undefined) {
    where.push('p.featured = ?');
    params.push(opts.featured ? 1 : 0);
  }
  if (opts.when) {
    const today = new Date().toISOString().slice(0, 10);
    where.push(opts.when === 'upcoming' ? "COALESCE(json_extract(p.data,'$.end_date'), json_extract(p.data,'$.event_date'), p.published_at) >= ?" : "COALESCE(json_extract(p.data,'$.end_date'), json_extract(p.data,'$.event_date'), p.published_at) < ?");
    params.push(today);
  }
  if (opts.q) {
    where.push('(p.title LIKE ? ESCAPE \'\\\' OR p.excerpt LIKE ? ESCAPE \'\\\')');
    const like = `%${opts.q.replace(/[\\%_]/g, '\\$&')}%`;
    params.push(like, like);
  }
  if (opts.excludeId) {
    where.push('p.id <> ?');
    params.push(opts.excludeId);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const joinSql = joins.join(' ');
  const total = db.get<{ n: number }>(`SELECT count(DISTINCT p.id) AS n FROM posts p ${joinSql} ${whereSql}`, ...params)?.n ?? 0;

  const limit = Math.min(Math.max(opts.limit ?? 12, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const rows = db.all<PostRow>(
    `SELECT DISTINCT ${opts.withBody ? FULL_COLUMNS : LIST_COLUMNS} FROM posts p ${joinSql} ${whereSql}
     ORDER BY ${orderSql(opts.order, opts.types)} LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  );
  return { posts: loadRelations(db, rows.map(rowToPost)), total };
}

export function postsByIds(db: Store, ids: number[], withBody = false): Post[] {
  if (ids.length === 0) return [];
  const rows = db.all<PostRow>(`SELECT ${withBody ? FULL_COLUMNS : LIST_COLUMNS} FROM posts p WHERE p.id IN (${ids.map(() => '?').join(',')}) AND p.status = 'published'`, ...ids);
  const map = new Map(loadRelations(db, rows.map(rowToPost)).map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is Post => Boolean(p));
}

export function countByType(db: Store): Record<PostType, number> {
  const out = { news: 0, article: 0, book: 0, magazine: 0, event: 0, forum: 0, video: 0 } as Record<PostType, number>;
  for (const r of db.all<{ type: PostType; n: number }>("SELECT type, count(*) n FROM posts WHERE status='published' GROUP BY type")) out[r.type] = r.n;
  return out;
}

export function yearsFor(db: Store, type: PostType): number[] {
  return db
    .all<{ y: string }>("SELECT DISTINCT substr(published_at,1,4) y FROM posts WHERE type = ? AND status='published' AND published_at IS NOT NULL ORDER BY y DESC", type)
    .map((r) => Number(r.y))
    .filter(Boolean);
}

export function relatedPosts(db: Store, post: Post, limit = 4): Post[] {
  const found = new Map<number, Post>();
  const add = (list: Post[]) => {
    for (const p of list) if (found.size < limit && !found.has(p.id) && p.id !== post.id) found.set(p.id, p);
  };
  if (post.type === 'article' && post.data.magazine_id) {
    add(listPosts(db, { types: ['article'], magazineId: Number(post.data.magazine_id), limit: limit + 1, order: 'newest' }).posts);
  }
  const author = post.authors[0];
  if (author && (post.type === 'article' || post.type === 'book')) {
    add(listPosts(db, { types: [post.type], authorId: author.id, limit: limit + 1 }).posts);
  }
  const term = post.terms.find((t) => t.taxonomy === 'article_category');
  if (term) add(listPosts(db, { types: [post.type], termId: term.id, limit: limit + 1 }).posts);
  if (found.size < limit) add(listPosts(db, { types: [post.type], limit: limit + 1 }).posts);
  return [...found.values()];
}

export function latestMagazine(db: Store): Post | null {
  return listPosts(db, { types: ['magazine'], limit: 1, order: 'issue' }).posts[0] ?? null;
}

export function incrementViews(db: Store, id: number): void {
  db.run('UPDATE posts SET views = views + 1 WHERE id = ?', id);
}

// ── Writes ───────────────────────────────────────────────────────────────────

function isoOrNull(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v.length === 10 ? `${v}T00:00:00Z` : v);
  return Number.isNaN(d.getTime()) ? null : v;
}

/** Link a post to authors (creating them, merged by normalized key). */
export function setPostAuthors(db: Store, postId: number, names: string[]): void {
  db.run('DELETE FROM post_authors WHERE post_id = ?', postId);
  let position = 0;
  const seen = new Set<number>();
  for (const raw of names) {
    const name = sanitizeText(raw);
    const key = authorKey(name);
    if (!key) continue;
    let author = db.get<{ id: number }>('SELECT id FROM authors WHERE name_key = ?', key);
    if (!author) {
      const r = db.run('INSERT INTO authors (name, name_key) VALUES (?, ?)', name, key);
      author = { id: r.lastId };
    }
    if (seen.has(author.id)) continue;
    seen.add(author.id);
    db.run('INSERT INTO post_authors (post_id, author_id, position) VALUES (?, ?, ?)', postId, author.id, position++);
  }
}

export function setPostTerms(db: Store, postId: number, terms: { taxonomy: string; name: string }[]): void {
  db.run('DELETE FROM post_terms WHERE post_id = ?', postId);
  for (const t of terms) {
    const name = sanitizeText(t.name);
    if (!name) continue;
    db.run('INSERT OR IGNORE INTO terms (taxonomy, name) VALUES (?, ?)', t.taxonomy, name);
    const term = db.get<{ id: number }>('SELECT id FROM terms WHERE taxonomy = ? AND name = ?', t.taxonomy, name);
    if (term) db.run('INSERT OR IGNORE INTO post_terms (post_id, term_id) VALUES (?, ?)', postId, term.id);
  }
}

function cleanFields(fields: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields ?? {})) {
    const clean = sanitizeText(String(v));
    if (clean) out[k] = clean;
  }
  return out;
}

export function createPost(db: Store, input: PostInput, opts: { id?: number; source?: 'manual' | 'legacy'; legacyUrl?: string } = {}): number {
  const body = sanitizeBody(input.body ?? '');
  const excerpt = sanitizeText(input.excerpt ?? '') || excerptFrom(body, 220);
  const fields = cleanFields(input.fields);
  const authorNames = input.authors ?? (fields.author ? splitAuthors(fields.author) : []);
  return db.tx(() => {
    const columns = `type, status, title, excerpt, body, cover, cover_alt, published_at, date_precision, fields, data, featured, source, legacy_url`;
    const values: Param[] = [
      input.type,
      input.status ?? 'draft',
      sanitizeText(input.title),
      excerpt,
      body,
      input.cover ?? null,
      sanitizeText(input.coverAlt ?? ''),
      isoOrNull(input.publishedAt),
      input.datePrecision ?? (input.publishedAt ? 'day' : 'none'),
      JSON.stringify(fields),
      JSON.stringify(input.data ?? {}),
      input.featured ? 1 : 0,
      opts.source ?? 'manual',
      opts.legacyUrl ?? null,
    ];
    const marks = values.map(() => '?').join(',');
    const id = opts.id
      ? (db.run(`INSERT INTO posts (id, ${columns}) VALUES (?, ${marks})`, opts.id, ...values), opts.id)
      : db.run(`INSERT INTO posts (${columns}) VALUES (${marks})`, ...values).lastId;
    setPostAuthors(db, id, authorNames);
    setPostTerms(db, id, input.terms ?? []);
    return id;
  });
}

export function updatePost(db: Store, id: number, input: Partial<PostInput>): boolean {
  const current = getPost(db, id, { status: 'any' });
  if (!current) return false;
  const body = input.body !== undefined ? sanitizeBody(input.body) : current.body;
  const fields = input.fields !== undefined ? cleanFields(input.fields) : current.fields;
  db.tx(() => {
    db.run(
      `UPDATE posts SET status=?, title=?, excerpt=?, body=?, cover=?, cover_alt=?, published_at=?, date_precision=?, fields=?, data=?, featured=?,
         edited = CASE WHEN source = 'legacy' THEN 1 ELSE edited END, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`,
      input.status ?? current.status,
      input.title !== undefined ? sanitizeText(input.title) : current.title,
      input.excerpt !== undefined ? sanitizeText(input.excerpt) || excerptFrom(body, 220) : current.excerpt,
      body,
      input.cover !== undefined ? input.cover : current.cover,
      input.coverAlt !== undefined ? sanitizeText(input.coverAlt) : current.coverAlt,
      input.publishedAt !== undefined ? isoOrNull(input.publishedAt) : current.publishedAt,
      input.datePrecision ?? (input.publishedAt !== undefined ? (input.publishedAt ? 'day' : 'none') : current.datePrecision),
      JSON.stringify(fields),
      JSON.stringify(input.data ?? current.data),
      (input.featured ?? current.featured) ? 1 : 0,
      id,
    );
    if (input.authors !== undefined) setPostAuthors(db, id, input.authors);
    else if (input.fields?.author !== undefined) setPostAuthors(db, id, splitAuthors(fields.author ?? ''));
    if (input.terms !== undefined) setPostTerms(db, id, input.terms);
  });
  return true;
}

export function deletePost(db: Store, id: number): boolean {
  return db.run('DELETE FROM posts WHERE id = ?', id).changes > 0;
}
