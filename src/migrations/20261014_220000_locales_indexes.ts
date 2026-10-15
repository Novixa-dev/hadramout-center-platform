import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Payload's SQLite schema indexes `_locales` by (_locale, _parent_id) only. Every list query runs a correlated
 * sub-select by _parent_id, which then scans the whole table (≈30 s for 900 articles). This index makes it O(1).
 */
const TABLES = ['news', 'articles', 'books', 'magazines', 'events', 'forum_events', 'videos', 'authors', 'categories', 'pages', 'timeline', 'media', 'site']

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const t of TABLES) {
    await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS \`${t}_locales_parent_idx\` ON \`${t}_locales\` (\`_parent_id\`)`))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const t of TABLES) {
    await db.run(sql.raw(`DROP INDEX IF EXISTS \`${t}_locales_parent_idx\``))
  }
}
