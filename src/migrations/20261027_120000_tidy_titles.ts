import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Tidies stored titles and names (all locales) the way the `titleText` field hook does on every new write:
 *  - invisible direction controls pasted from Word/PDF (LRM/RLM, embeddings, isolates) are removed — they broke search
 *    matching and copy/paste (5 titles: 4 books, 1 article with forty U+202C);
 *  - decorative kashida runs inside words are removed ("روايـــة" → "رواية", 6 article titles); a run elsewhere
 *    collapses to one tatweel so marks such as "1000هـ" stay.
 * Idempotent: rows already clean are not touched. The rule is copied here (not imported) so the migration stays frozen.
 * down() is a no-op: the removed characters carried no content, and the pre-deploy backup holds the original text.
 */

const TIDY = (text: string): string =>
  text
    .replace(/[‎‏‪-‮⁦-⁩]/g, '')
    .replace(/ـ{2,}(?=\p{Script=Arabic})/gu, '')
    .replace(/ـ{2,}/g, 'ـ')
    .replace(/\s+/g, ' ')
    .trim()

const TARGETS = [
  ...['news', 'articles', 'books', 'magazines', 'events', 'forum_events', 'videos', 'pages', 'timeline'].map((t) => [t, 'title'] as const),
  ['authors', 'name'] as const,
  ['categories', 'name'] as const,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [t, column] of TARGETS) {
    const table = sql.raw(`\`${t}_locales\``)
    const col = sql.raw(`\`${column}\``)
    const rows = await db.all<{ id: number; v: string | null }>(sql`SELECT id, ${col} AS v FROM ${table} WHERE ${col} IS NOT NULL`)
    for (const row of rows) {
      if (!row.v) continue
      const clean = TIDY(row.v)
      if (clean && clean !== row.v) await db.run(sql`UPDATE ${table} SET ${col} = ${clean} WHERE id = ${row.id}`)
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // nothing to restore: see the note above
}
