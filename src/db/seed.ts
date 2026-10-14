import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { Store } from './store.ts';
import { authorKey, splitAuthors } from '../lib/arabic.ts';
import { sanitizeText } from '../lib/sanitize.ts';
import { DEFAULT_GLOSSARY, DEFAULT_PAGES, DEFAULT_TIMELINE } from './defaults.ts';
import { reindexAll } from './search.ts';
import { DEFAULT_SITE, setSetting, getSetting } from './settings.ts';
import type { Snapshot } from '../importer/crawl.ts';

export interface SeedReport {
  inserted: number;
  updated: number;
  skippedEdited: number;
  authors: number;
  terms: number;
}

export function readSnapshot(file: string): Snapshot {
  return JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')) as Snapshot;
}

/** Pick the most common spelling of each author (ties: the longer, more complete one). */
function canonicalAuthorNames(snapshot: Snapshot): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();
  for (const post of snapshot.posts) {
    for (const raw of post.authors.length ? post.authors : post.fields.author ? splitAuthors(post.fields.author) : []) {
      const name = sanitizeText(raw);
      const key = authorKey(name);
      if (!key) continue;
      const variants = counts.get(key) ?? new Map<string, number>();
      variants.set(name, (variants.get(name) ?? 0) + 1);
      counts.set(key, variants);
    }
  }
  const out = new Map<string, string>();
  for (const [key, variants] of counts) {
    const best = [...variants].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0];
    if (best) out.set(key, best[0]);
  }
  return out;
}

/**
 * Load the legacy snapshot. Safe to repeat: legacy rows a human has edited are never overwritten,
 * rows created in the admin are never touched.
 */
export function seedFromSnapshot(db: Store, snapshot: Snapshot): SeedReport {
  const report: SeedReport = { inserted: 0, updated: 0, skippedEdited: 0, authors: 0, terms: 0 };
  const canonical = canonicalAuthorNames(snapshot);

  db.tx(() => {
    for (const [key, name] of canonical) {
      const exists = db.get<{ id: number }>('SELECT id FROM authors WHERE name_key = ?', key);
      if (!exists) {
        db.run('INSERT INTO authors (name, name_key) VALUES (?, ?)', name, key);
        report.authors++;
      }
    }

    for (const p of snapshot.posts) {
      const existing = db.get<{ source: string; edited: number }>('SELECT source, edited FROM posts WHERE id = ?', p.id);
      if (existing && (existing.source !== 'legacy' || existing.edited === 1)) {
        report.skippedEdited++;
        continue;
      }
      const values = [
        p.type, p.status, p.title, p.excerpt, p.body, p.cover, p.coverAlt, p.publishedAt, p.datePrecision,
        JSON.stringify(p.fields), JSON.stringify(p.data), p.legacyUrl,
      ] as const;
      if (existing) {
        db.run(
          `UPDATE posts SET type=?, status=?, title=?, excerpt=?, body=?, cover=?, cover_alt=?, published_at=?, date_precision=?, fields=?, data=?, legacy_url=?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
          ...values,
          p.id,
        );
        report.updated++;
      } else {
        db.run(
          `INSERT INTO posts (id, type, status, title, excerpt, body, cover, cover_alt, published_at, date_precision, fields, data, legacy_url, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'legacy')`,
          p.id,
          ...values,
        );
        report.inserted++;
      }

      db.run('DELETE FROM post_authors WHERE post_id = ?', p.id);
      let position = 0;
      const linked = new Set<number>();
      for (const raw of p.authors) {
        const key = authorKey(sanitizeText(raw));
        const author = key ? db.get<{ id: number }>('SELECT id FROM authors WHERE name_key = ?', key) : undefined;
        if (author && !linked.has(author.id)) {
          linked.add(author.id);
          db.run('INSERT INTO post_authors (post_id, author_id, position) VALUES (?, ?, ?)', p.id, author.id, position++);
        }
      }

      db.run('DELETE FROM post_terms WHERE post_id = ?', p.id);
      for (const t of p.terms) {
        if (t.taxonomy === 'content_kind') continue;
        db.run('INSERT OR IGNORE INTO terms (taxonomy, name) VALUES (?, ?)', t.taxonomy, t.name);
        const term = db.get<{ id: number }>('SELECT id FROM terms WHERE taxonomy = ? AND name = ?', t.taxonomy, t.name);
        if (term) {
          db.run('INSERT OR IGNORE INTO post_terms (post_id, term_id) VALUES (?, ?)', p.id, term.id);
        }
      }
    }
    report.terms = db.get<{ n: number }>('SELECT count(*) n FROM terms')?.n ?? 0;
  });

  reindexAll(db);
  return report;
}

/** Insert defaults that the legacy site does not provide (never overwrites existing rows). */
export function seedDefaults(db: Store): void {
  db.tx(() => {
    for (const p of DEFAULT_PAGES) db.run('INSERT OR IGNORE INTO pages (slug, title, body) VALUES (?, ?, ?)', p.slug, p.title, p.body);
    if ((db.get<{ n: number }>('SELECT count(*) n FROM timeline_events')?.n ?? 0) === 0) {
      for (const e of DEFAULT_TIMELINE) {
        db.run('INSERT INTO timeline_events (year_from, year_to, era, title, body, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)', e.yearFrom, e.yearTo ?? null, e.era, e.title, e.body, e.source, 'published');
      }
    }
    for (const g of DEFAULT_GLOSSARY) {
      db.run('INSERT OR IGNORE INTO glossary (term_ar, lang, translation, kind) VALUES (?, ?, ?, ?)', g.termAr, g.lang, g.translation, g.kind);
    }
    if (!db.get('SELECT 1 FROM settings WHERE key = ?', 'site')) setSetting(db, 'site', DEFAULT_SITE);
  });
  getSetting(db, 'site', DEFAULT_SITE);
}
