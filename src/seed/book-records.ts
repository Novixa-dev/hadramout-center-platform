import { createHash } from 'node:crypto';
import { sql } from '@payloadcms/db-sqlite';
import { authorKey } from '../lib/arabic.ts';
import { splitHonorific } from '../lib/author-names.ts';
import { BOOK_EVENTS, BOOK_TITLES, bookDateText, type BookEvent, type BookPaper } from './book-records-data.ts';

type SQL = ReturnType<typeof sql.raw>;

/** The part of Drizzle that both a migration's `db` and `payload.db.drizzle` offer. */
export interface RawDb {
  all(query: SQL): Promise<unknown[]> | unknown[];
  run(query: SQL): Promise<unknown> | unknown;
}

export interface BookRecordsReport {
  created: number;
  matched: number;
  datesCorrected: number;
  papers: number;
  participants: number;
  books: number;
  /** Records whose row the old site should have and does not: never created, so a wrong match can't hide. */
  unmatched: string[];
}

/** Marks array rows this code wrote (Payload's own ids are plain hex), so `revert` touches nothing an editor added. */
const ROW_PREFIX = 'book';
const rowId = (key: string, n: number): string => `${ROW_PREFIX}${createHash('sha1').update(`${key}:${n}`).digest('hex').slice(0, 20)}`;

const sourceNote = (page: number): string => `<p><small>المصدر: كتاب «عقد من المنجزات والتحديات» الصادر عن المركز، ص ${page}.</small></p>`;
const SEVENTH_CONFERENCE = '<li>السابع: المدن والبلدات الحضرمية، التاريخ، الحاضر، المستقبل — المكلا، 24–25 ديسمبر 2025م.</li>';
const SIXTH_CONFERENCE = '<li>السادس: (1950–1967).</li>';

/** The card text of a record the old site has no row for: only what the book states. */
export function bookExcerpt(e: BookEvent): string {
  const when = e.date ? bookDateText(e.date, e.end) : e.when;
  const facts = [e.speaker && `المحاضر: ${e.speaker}`, e.moderator && `إدارة: ${e.moderator}`, e.venue, when].filter(Boolean).join(' — ');
  return facts.length >= 50 ? facts : [e.title, facts].filter(Boolean).join(' — '); // long enough for a search-result description
}

const tables = (c: BookEvent['collection']) => ({
  main: sql.raw(c),
  locales: sql.raw(`${c}_locales`),
  papers: sql.raw(`${c}_papers`),
  papersLocales: sql.raw(`${c}_papers_locales`),
  people: sql.raw(`${c}_participants`),
  peopleLocales: sql.raw(`${c}_participants_locales`),
});

async function findRow(db: RawDb, e: BookEvent): Promise<{ id: number; event_date: string | null } | undefined> {
  const t = tables(e.collection);
  const rows = (await db.all(
    e.match
      ? sql`SELECT m.id, m.event_date FROM ${t.main} m JOIN ${t.locales} l ON l._parent_id = m.id AND l._locale = 'ar' WHERE instr(l.title, ${e.match}) > 0 ORDER BY m.id LIMIT 1`
      : sql`SELECT m.id, m.event_date FROM ${t.main} m JOIN ${t.locales} l ON l._parent_id = m.id AND l._locale = 'ar' WHERE l.title = ${e.title as string} ORDER BY m.id LIMIT 1`,
  )) as { id: number; event_date: string | null }[];
  return rows[0];
}

async function insertPapers(db: RawDb, e: BookEvent, parent: number, papers: readonly BookPaper[]): Promise<number> {
  const t = tables(e.collection);
  const have = (await db.all(sql`SELECT count(*) AS n FROM ${t.papers} WHERE _parent_id = ${parent}`)) as { n: number }[];
  if (have[0]?.n) return 0; // an editor's list stays as it is
  for (const [i, [researcher, title, note]] of papers.entries()) {
    const id = rowId(`${e.key}:paper`, i);
    await db.run(sql`INSERT INTO ${t.papers} (_order, _parent_id, id) VALUES (${i + 1}, ${parent}, ${id})`);
    await db.run(sql`INSERT INTO ${t.papersLocales} (title, researcher, abstract, _locale, _parent_id) VALUES (${title}, ${researcher}, ${note ?? null}, 'ar', ${id})`);
  }
  return papers.length;
}

async function insertResearchers(db: RawDb, e: BookEvent, parent: number, names: readonly string[]): Promise<number> {
  const t = tables(e.collection);
  const have = (await db.all(sql`SELECT count(*) AS n FROM ${t.people} WHERE _parent_id = ${parent}`)) as { n: number }[];
  if (have[0]?.n) return 0;
  for (const [i, name] of names.entries()) {
    const id = rowId(`${e.key}:person`, i);
    await db.run(sql`INSERT INTO ${t.people} (_order, _parent_id, id, role) VALUES (${i + 1}, ${parent}, ${id}, 'researcher')`);
    await db.run(sql`INSERT INTO ${t.peopleLocales} (name, _locale, _parent_id) VALUES (${name}, 'ar', ${id})`);
  }
  return names.length;
}

async function applyEvent(db: RawDb, e: BookEvent, now: string, report: BookRecordsReport): Promise<void> {
  const t = tables(e.collection);
  let row = await findRow(db, e);
  if (!row && e.match) {
    report.unmatched.push(e.key);
    return;
  }
  if (!row) {
    const published = e.date ?? (e.year ? `${e.year}-01-01` : null);
    await db.run(sql`INSERT INTO ${t.main} (status, published_at, date_precision, event_date, end_date, kind, source, updated_at, created_at)
      VALUES ('published', ${published}, ${e.year ? 'year' : 'day'}, ${e.date ?? null}, ${e.end ?? null}, ${e.kind ?? null}, 'manual', ${now}, ${now})`);
    const made = (await db.all(sql`SELECT max(id) AS id FROM ${t.main}`)) as { id: number }[];
    row = { id: made[0]?.id as number, event_date: e.date ?? null };
    await db.run(sql`INSERT INTO ${t.locales} (title, excerpt, body, speaker, moderator, venue, time_text, _locale, _parent_id)
      VALUES (${e.title as string}, ${bookExcerpt(e) || null}, ${sourceNote(e.page)}, ${e.speaker ?? null}, ${e.moderator ?? null}, ${e.venue ?? null}, ${e.when ?? null}, 'ar', ${row.id})`);
    report.created++;
  } else {
    report.matched++;
    // only ever fills what is empty; the one replacement is a date that still holds the exact wrong value
    await db.run(sql`UPDATE ${t.main} SET
        kind = COALESCE(kind, ${e.kind ?? null}),
        event_date = COALESCE(event_date, ${e.date ?? null}),
        end_date = COALESCE(end_date, ${e.end ?? null}),
        published_at = COALESCE(published_at, ${e.date ?? null}),
        updated_at = ${now}
      WHERE id = ${row.id}`);
    if (e.was && e.date && row.event_date?.slice(0, 10) === e.was) {
      await db.run(sql`UPDATE ${t.main} SET event_date = ${e.date}, published_at = ${e.date}, end_date = COALESCE(${e.end ?? null}, end_date) WHERE id = ${row.id}`);
      report.datesCorrected++;
    }
    await db.run(sql`UPDATE ${t.locales} SET
        venue = COALESCE(NULLIF(venue, ''), ${e.venue ?? null}),
        speaker = COALESCE(NULLIF(speaker, ''), ${e.speaker ?? null}),
        moderator = COALESCE(NULLIF(moderator, ''), ${e.moderator ?? null})
      WHERE _parent_id = ${row.id} AND _locale = 'ar'`);
    if (e.papers?.length || e.researchers?.length) {
      await db.run(sql`UPDATE ${t.locales} SET body = COALESCE(body, '') || ${sourceNote(e.page)}
        WHERE _parent_id = ${row.id} AND _locale = 'ar' AND instr(COALESCE(body, ''), 'عقد من المنجزات') = 0`);
    }
  }
  if (e.papers?.length) report.papers += await insertPapers(db, e, row.id, e.papers);
  if (e.researchers?.length) report.participants += await insertResearchers(db, e, row.id, e.researchers);
}

async function authorId(db: RawDb, raw: string, now: string): Promise<number> {
  const key = authorKey(raw);
  const found = (await db.all(sql`SELECT id FROM authors WHERE name_key = ${key} LIMIT 1`)) as { id: number }[];
  if (found[0]) return found[0].id;
  const split = splitHonorific(raw);
  await db.run(sql`INSERT INTO authors (name_key, updated_at, created_at) VALUES (${key}, ${now}, ${now})`);
  const made = (await db.all(sql`SELECT max(id) AS id FROM authors`)) as { id: number }[];
  const id = made[0]?.id as number;
  await db.run(sql`INSERT INTO authors_locales (name, honorific, _locale, _parent_id) VALUES (${split?.name ?? raw}, ${split?.honorific ?? null}, 'ar', ${id})`);
  return id;
}

/**
 * Writes the book's records. Safe to repeat and never overwrites an editor's work: rows are found by title, empty fields are
 * filled, array lists are added only to rows that have none. Needs the old site's rows, so it does nothing on an empty database
 * (the seeder calls it again after the snapshot).
 */
export async function applyBookRecords(db: RawDb, now: string = new Date().toISOString()): Promise<BookRecordsReport> {
  const report: BookRecordsReport = { created: 0, matched: 0, datesCorrected: 0, papers: 0, participants: 0, books: 0, unmatched: [] };
  const count = (await db.all(sql`SELECT count(*) AS n FROM events`)) as { n: number }[];
  if (!count[0]?.n) return report;

  for (const e of BOOK_EVENTS) await applyEvent(db, e, now, report);

  for (const b of BOOK_TITLES) {
    const exists = (await db.all(sql`SELECT 1 AS x FROM books_locales WHERE _locale = 'ar' AND title = ${b.title} LIMIT 1`)) as unknown[];
    if (exists.length) continue;
    await db.run(sql`INSERT INTO books (status, published_at, date_precision, year, source, updated_at, created_at)
      VALUES ('published', ${b.year ? `${b.year}-01-01` : null}, 'year', ${b.year ?? null}, 'manual', ${now}, ${now})`);
    const made = (await db.all(sql`SELECT max(id) AS id FROM books`)) as { id: number }[];
    const id = made[0]?.id as number;
    await db.run(sql`INSERT INTO books_locales (title, excerpt, body, publisher, edition, translator, _locale, _parent_id)
      VALUES (${b.title}, ${b.excerpt}, ${`<p>${b.excerpt}</p>${sourceNote(b.page)}`}, 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر', ${b.edition ?? null}, ${b.translator ?? null}, 'ar', ${id})`);
    for (const [i, name] of b.authors.entries()) {
      await db.run(sql`INSERT INTO books_rels ("order", parent_id, path, authors_id) VALUES (${i + 1}, ${id}, 'authors', ${await authorId(db, name, now)})`);
    }
    report.books++;
  }

  // the book's summary (p. 174) stops at the sixth conference; p. 36 prints the seventh
  await db.run(sql`UPDATE pages_locales SET body = replace(replace(body, ${SIXTH_CONFERENCE}, ${SIXTH_CONFERENCE + SEVENTH_CONFERENCE}), '<strong>6</strong> مؤتمرات علمية', '<strong>7</strong> مؤتمرات علمية')
    WHERE _locale = 'ar' AND _parent_id = (SELECT id FROM pages WHERE slug = 'decade') AND instr(body, ${SEVENTH_CONFERENCE}) = 0`);
  return report;
}

/** Undoes `applyBookRecords`, leaving whatever editors changed since. */
export async function revertBookRecords(db: RawDb): Promise<void> {
  for (const c of ['events', 'forum_events'] as const) {
    const t = tables(c);
    const like = `${ROW_PREFIX}%`;
    await db.run(sql`DELETE FROM ${t.papersLocales} WHERE _parent_id LIKE ${like}`);
    await db.run(sql`DELETE FROM ${t.papers} WHERE id LIKE ${like}`);
    await db.run(sql`DELETE FROM ${t.peopleLocales} WHERE _parent_id LIKE ${like}`);
    await db.run(sql`DELETE FROM ${t.people} WHERE id LIKE ${like}`);
  }
  for (const e of BOOK_EVENTS) {
    const t = tables(e.collection);
    const row = await findRow(db, e);
    if (!row) continue;
    if (e.title) {
      await db.run(sql`DELETE FROM ${t.locales} WHERE _parent_id = ${row.id} AND EXISTS (SELECT 1 FROM ${t.main} m WHERE m.id = ${row.id} AND m.source = 'manual' AND COALESCE(m.edited, 0) = 0)`);
      await db.run(sql`DELETE FROM ${t.main} WHERE id = ${row.id} AND source = 'manual' AND COALESCE(edited, 0) = 0`);
      continue;
    }
    if (e.was && e.date) await db.run(sql`UPDATE ${t.main} SET event_date = ${e.was}, published_at = ${e.was} WHERE id = ${row.id} AND event_date = ${e.date}`);
    await db.run(sql`UPDATE ${t.locales} SET
        venue = CASE WHEN venue = ${e.venue ?? null} THEN NULL ELSE venue END,
        speaker = CASE WHEN speaker = ${e.speaker ?? null} THEN NULL ELSE speaker END,
        moderator = CASE WHEN moderator = ${e.moderator ?? null} THEN NULL ELSE moderator END,
        body = replace(body, ${sourceNote(e.page)}, '')
      WHERE _parent_id = ${row.id} AND _locale = 'ar'`);
  }
  for (const b of BOOK_TITLES) {
    const rows = (await db.all(sql`SELECT b.id FROM books b JOIN books_locales l ON l._parent_id = b.id AND l._locale = 'ar' WHERE l.title = ${b.title} AND b.source = 'manual' AND COALESCE(b.edited, 0) = 0`)) as { id: number }[];
    for (const { id } of rows) {
      await db.run(sql`DELETE FROM books_rels WHERE parent_id = ${id}`);
      await db.run(sql`DELETE FROM books_locales WHERE _parent_id = ${id}`);
      await db.run(sql`DELETE FROM books WHERE id = ${id}`);
    }
  }
  await db.run(sql`UPDATE pages_locales SET body = replace(replace(body, ${SEVENTH_CONFERENCE}, ''), '<strong>7</strong> مؤتمرات علمية', '<strong>6</strong> مؤتمرات علمية')
    WHERE _locale = 'ar' AND _parent_id = (SELECT id FROM pages WHERE slug = 'decade')`);
}
