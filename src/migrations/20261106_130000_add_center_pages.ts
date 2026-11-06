import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
import { CENTER_PAGES } from '../seed/center-pages.ts'

/**
 * Adds the institutional pages written from the Center's tenth-anniversary book (vision and mission, goals, organisation,
 * the decade, the 2026–2030 plan, the digital library project, partnerships). They back the grouped "About the Center" menu.
 * Idempotent: a page whose slug already exists (an editor's own, or an earlier run) is never touched.
 * down() removes only pages still marked as unedited seeds (no editor note), by slug.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const now = new Date().toISOString()
  for (const p of CENTER_PAGES) {
    const exists = await db.all<{ id: number }>(sql`SELECT id FROM pages WHERE slug = ${p.slug}`)
    if (exists.length) continue
    await db.run(sql`INSERT INTO pages (slug, status, nav_placement, nav_order, updated_at, created_at) VALUES (${p.slug}, 'published', 'none', 0, ${now}, ${now})`)
    const row = await db.all<{ id: number }>(sql`SELECT id FROM pages WHERE slug = ${p.slug}`)
    const id = row[0]?.id
    if (!id) throw new Error(`page ${p.slug} was not created`)
    await db.run(sql`INSERT INTO pages_locales (title, body, _locale, _parent_id) VALUES (${p.title}, ${p.body}, 'ar', ${id})`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const p of CENTER_PAGES) {
    await db.run(sql`DELETE FROM pages_locales WHERE _parent_id IN (SELECT id FROM pages WHERE slug = ${p.slug} AND editorial_notes IS NULL)`)
    await db.run(sql`DELETE FROM pages WHERE slug = ${p.slug} AND editorial_notes IS NULL`)
  }
}
