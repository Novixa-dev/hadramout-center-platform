import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Certain, mechanical corrections to the imported Arabic source text (audit 2026-10-16). Idempotent: every statement
 * only touches rows that still contain the defect. Nothing historical is rewritten; each fix is listed in
 * docs/09-redesign/02-editorial-issues.md.
 *
 *  1. «عن بعنوان» → «بعنوان»  — a doubled preposition in event titles of the old site (e.g. «فعالية … عن بعنوان …»).
 *  2. Stray Markdown asterisks in titles («*محاولات توحيد الكلمة…*») — legacy formatting residue, never meaningful.
 *  3. Issue 41's announcement says «صدور العدد 40» in its heading while its own title, number and text say 41.
 *
 * Only the Arabic source locale is changed; machine translations are regenerated from it on demand.
 */

const TITLE_TABLES = ['news', 'articles', 'events', 'forum_events'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const t of TITLE_TABLES) {
    const table = sql.raw(`\`${t}_locales\``)
    await db.run(sql`UPDATE ${table} SET title = replace(title, 'عن بعنوان', 'بعنوان') WHERE _locale = 'ar' AND title LIKE '%عن بعنوان%'`)
    await db.run(sql`UPDATE ${table} SET title = trim(replace(replace(title, '*', ''), '  ', ' ')) WHERE _locale = 'ar' AND title LIKE '%*%'`)
  }
  await db.run(sql`UPDATE magazines_locales SET excerpt = replace(excerpt, 'صدور العدد 40 من مجلة', 'صدور العدد 41 من مجلة') WHERE _locale = 'ar' AND excerpt LIKE '%صدور العدد 40 من مجلة%' AND _parent_id IN (SELECT id FROM magazines WHERE issue_number = 41)`)
  await db.run(sql`UPDATE magazines_locales SET body = replace(body, 'صدور العدد 40 من مجلة', 'صدور العدد 41 من مجلة') WHERE _locale = 'ar' AND body LIKE '%صدور العدد 40 من مجلة%' AND _parent_id IN (SELECT id FROM magazines WHERE issue_number = 41)`)
}

export async function down(): Promise<void> {
  // Source-text corrections are intentionally not reverted (the old text was wrong).
}
