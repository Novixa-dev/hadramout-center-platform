import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE INDEX \`news_locales_parent_id_idx\` ON \`news_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_locales_parent_id_idx\` ON \`articles_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`books_locales_parent_id_idx\` ON \`books_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`magazines_locales_parent_id_idx\` ON \`magazines_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`events_locales_parent_id_idx\` ON \`events_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_locales_parent_id_idx\` ON \`forum_events_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`videos_locales_parent_id_idx\` ON \`videos_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`authors_locales_parent_id_idx\` ON \`authors_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_locales_parent_id_idx\` ON \`categories_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_locales_parent_id_idx\` ON \`pages_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`timeline_locales_parent_id_idx\` ON \`timeline_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`media_locales_parent_id_idx\` ON \`media_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`site_locales_parent_id_idx\` ON \`site_locales\` (\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`news_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`articles_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`books_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`magazines_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`events_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`forum_events_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`videos_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`authors_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`categories_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`pages_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`timeline_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`media_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`site_locales_parent_id_idx\`;`)
}
