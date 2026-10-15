import { join } from 'node:path';
import { Store } from '../db/store.ts';

/**
 * "Extras" database: derived or aggregate data that must never live in Payload's schema —
 * the full-text index (rebuildable from content), anonymous page-view counters, search-query
 * statistics and small rate-limit buckets. A separate SQLite file keeps Payload's schema
 * migrations and these tables fully independent.
 */
const SCHEMA = `
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  title, excerpt, body, authors, stems,
  lang UNINDEXED, doc_id UNINDEXED, kind UNINDEXED,
  tokenize = "unicode61 remove_diacritics 2"
);
CREATE TABLE IF NOT EXISTS pageviews (
  day TEXT NOT NULL, path TEXT NOT NULL, lang TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path, lang)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS search_queries (
  day TEXT NOT NULL, q TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, results INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, q)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS not_found_log (
  day TEXT NOT NULL, path TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL, window INTEGER NOT NULL, hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window)
) WITHOUT ROWID;
`;

export function dataDir(): string {
  return process.env.DATA_DIR ?? './data';
}

export function openExtras(path = join(dataDir(), 'extras.db')): Store {
  const store = new Store(path);
  store.exec(SCHEMA);
  return store;
}

const g = globalThis as { __hcExtras?: Store };

/** Process-wide singleton (survives Next.js hot reloads in development). */
export function extras(): Store {
  g.__hcExtras ??= openExtras();
  return g.__hcExtras;
}
