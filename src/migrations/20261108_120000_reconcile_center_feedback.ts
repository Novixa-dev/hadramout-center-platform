import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
import { CENTER_PAGES_2026_11 } from '../seed/center-pages.ts'
import { MOVED_PAGES } from '../lib/nav.ts'

/**
 * Two passes over the Center's feedback were developed side by side (migrations 20261103_* and 20261106_*). Whatever order a
 * database ran them in, this leaves one schema: `attendance` (replaces `mode`) and `supporters` as a list (replaces the text
 * column, whose values are kept). Pages one pass superseded go to draft, never deleted; the old addresses redirect (MOVED_PAGES).
 * Also adds the book's documents and media chapters when missing.
 */
const NOTE = 'seed:20261108_120000_reconcile_center_feedback'
const NEW_ID = sql`lower(hex(randomblob(12)))`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [table, locales, list, listLocales] of [
    ['events', 'events_locales', 'events_supporters', 'events_supporters_locales'],
    ['forum_events', 'forum_events_locales', 'forum_events_supporters', 'forum_events_supporters_locales'],
  ] as const) {
    const rows = await db.all<{ parent: number; text: string }>(sql.raw(`SELECT _parent_id AS parent, supporters AS text FROM ${locales} WHERE _locale = 'ar' AND supporters IS NOT NULL AND trim(supporters) <> ''`))
    for (const row of rows) {
      const names = row.text.split(/[،,]/).map((x) => x.trim()).filter(Boolean)
      for (const [i, name] of names.entries()) {
        const made = await db.all<{ id: string }>(sql`SELECT ${NEW_ID} AS id`)
        const id = made[0]?.id as string
        await db.run(sql`INSERT INTO ${sql.raw(list)} (_order, _parent_id, id) VALUES (${i + 1}, ${row.parent}, ${id})`)
        await db.run(sql`INSERT INTO ${sql.raw(listLocales)} (name, _locale, _parent_id) VALUES (${name}, 'ar', ${id})`)
      }
    }
    await db.run(sql.raw(`ALTER TABLE ${locales} DROP COLUMN supporters`))
    await db.run(sql.raw(`UPDATE ${table} SET attendance = CASE mode WHEN 'in_person' THEN 'onsite' ELSE mode END WHERE attendance IS NULL AND mode IS NOT NULL`))
    await db.run(sql.raw(`ALTER TABLE ${table} DROP COLUMN mode`))
  }
  const now = new Date().toISOString()
  for (const slug of Object.keys(MOVED_PAGES)) await db.run(sql`UPDATE pages SET status = 'draft', updated_at = ${now} WHERE slug = ${slug}`)
  for (const p of CENTER_PAGES_2026_11) {
    await db.run(sql`INSERT INTO pages (slug, status, noindex, nav_placement, nav_order, published_at, hero_layout, schema_type, show_breadcrumbs, editorial_notes, updated_at, created_at)
      SELECT ${p.slug}, 'published', 0, 'none', ${p.order}, ${now}, 'standard', 'WebPage', 1, ${NOTE}, ${now}, ${now}
      WHERE NOT EXISTS (SELECT 1 FROM pages WHERE slug = ${p.slug})`)
    await db.run(sql`INSERT INTO pages_locales (title, body, lead, _locale, _parent_id)
      SELECT ${p.title}, ${p.body}, ${p.lead}, 'ar', id FROM pages
      WHERE slug = ${p.slug} AND NOT EXISTS (SELECT 1 FROM pages_locales l WHERE l._parent_id = pages.id AND l._locale = 'ar')`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DELETE FROM pages_locales WHERE _parent_id IN (SELECT id FROM pages WHERE editorial_notes = ${NOTE})`)
  await db.run(sql`DELETE FROM pages WHERE editorial_notes = ${NOTE}`)
  for (const slug of Object.keys(MOVED_PAGES)) await db.run(sql`UPDATE pages SET status = 'published' WHERE slug = ${slug}`)
  for (const [table, locales, list, listLocales] of [
    ['events', 'events_locales', 'events_supporters', 'events_supporters_locales'],
    ['forum_events', 'forum_events_locales', 'forum_events_supporters', 'forum_events_supporters_locales'],
  ] as const) {
    await db.run(sql.raw(`ALTER TABLE ${table} ADD mode text`))
    await db.run(sql.raw(`UPDATE ${table} SET mode = CASE attendance WHEN 'onsite' THEN 'in_person' ELSE attendance END`))
    await db.run(sql.raw(`ALTER TABLE ${locales} ADD supporters text`))
    await db.run(sql.raw(`UPDATE ${locales} SET supporters = (SELECT group_concat(l.name, '، ') FROM ${listLocales} l JOIN ${list} s ON s.id = l._parent_id WHERE s._parent_id = ${locales}._parent_id AND l._locale = ${locales}._locale)`))
    await db.run(sql.raw(`DELETE FROM ${list}`))
  }
}
