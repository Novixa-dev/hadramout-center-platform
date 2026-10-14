import type { Store, Param } from './store.ts';
import { normalizeArabic } from '../lib/arabic.ts';

export interface AuthorSummary {
  id: number;
  name: string;
  bio: string;
  articles: number;
  books: number;
  total: number;
}

export interface TermSummary {
  id: number;
  taxonomy: string;
  name: string;
  count: number;
}

interface AuthorRow {
  id: number;
  name: string;
  bio: string;
  articles: number;
  books: number;
  total: number;
}

const AUTHOR_SELECT = `
  SELECT a.id, a.name, a.bio,
         COALESCE(SUM(p.type = 'article'), 0) AS articles,
         COALESCE(SUM(p.type = 'book'), 0)    AS books,
         COUNT(p.id)                          AS total
  FROM authors a
  LEFT JOIN post_authors pa ON pa.author_id = a.id
  LEFT JOIN posts p ON p.id = pa.post_id AND p.status = 'published'`;

export function listAuthors(db: Store, opts: { q?: string; limit?: number; offset?: number; minPosts?: number } = {}): { authors: AuthorSummary[]; total: number } {
  const having: string[] = [`COUNT(p.id) >= ${Math.max(opts.minPosts ?? 1, 0)}`];
  const params: Param[] = [];
  const where: string[] = [];
  if (opts.q) {
    where.push('a.name_key LIKE ?');
    params.push(`%${normalizeArabic(opts.q).replace(/[\\%_]/g, '\\$&')}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const grouped = `${AUTHOR_SELECT} ${whereSql} GROUP BY a.id HAVING ${having.join(' AND ')}`;
  const total = db.get<{ n: number }>(`SELECT count(*) n FROM (${grouped})`, ...params)?.n ?? 0;
  const rows = db.all<AuthorRow>(`${grouped} ORDER BY a.name_key COLLATE NOCASE LIMIT ? OFFSET ?`, ...params, opts.limit ?? 60, opts.offset ?? 0);
  return { authors: rows, total };
}

export function getAuthor(db: Store, id: number): AuthorSummary | null {
  return db.get<AuthorRow>(`${AUTHOR_SELECT} WHERE a.id = ? GROUP BY a.id`, id) ?? null;
}

export function topAuthors(db: Store, limit = 8): AuthorSummary[] {
  return db.all<AuthorRow>(`${AUTHOR_SELECT} GROUP BY a.id HAVING COUNT(p.id) > 0 ORDER BY COUNT(p.id) DESC, a.name_key LIMIT ?`, limit);
}

/** Merge duplicate author records into one (admin tool). */
export function mergeAuthors(db: Store, keepId: number, mergeIds: number[]): void {
  db.tx(() => {
    for (const id of mergeIds) {
      if (id === keepId) continue;
      db.run('UPDATE OR IGNORE post_authors SET author_id = ? WHERE author_id = ?', keepId, id);
      db.run('DELETE FROM post_authors WHERE author_id = ?', id);
      db.run('DELETE FROM authors WHERE id = ?', id);
    }
  });
}

export function listTerms(db: Store, taxonomy: string, type?: string): TermSummary[] {
  return db.all<TermSummary>(
    `SELECT t.id, t.taxonomy, t.name, COUNT(p.id) AS count
     FROM terms t
     JOIN post_terms pt ON pt.term_id = t.id
     JOIN posts p ON p.id = pt.post_id AND p.status = 'published' ${type ? 'AND p.type = ?' : ''}
     WHERE t.taxonomy = ?
     GROUP BY t.id ORDER BY count DESC, t.name`,
    ...(type ? [type, taxonomy] : [taxonomy]),
  );
}

export function getTerm(db: Store, id: number): { id: number; taxonomy: string; name: string } | null {
  return db.get<{ id: number; taxonomy: string; name: string }>('SELECT id, taxonomy, name FROM terms WHERE id = ?', id) ?? null;
}
