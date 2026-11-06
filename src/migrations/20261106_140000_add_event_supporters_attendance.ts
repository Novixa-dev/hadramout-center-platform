import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Client request (events and forum events): who supports the event, and whether it is in person, virtual or both.
 * `supporters` is translatable text (events_locales); `attendance` is a plain select (events). Existing rows stay empty.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events_locales\` ADD \`supporters\` text;`)
  await db.run(sql`ALTER TABLE \`forum_events_locales\` ADD \`supporters\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`attendance\` text;`)
  await db.run(sql`ALTER TABLE \`forum_events\` ADD \`attendance\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events_locales\` DROP COLUMN \`supporters\`;`)
  await db.run(sql`ALTER TABLE \`forum_events_locales\` DROP COLUMN \`supporters\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`attendance\`;`)
  await db.run(sql`ALTER TABLE \`forum_events\` DROP COLUMN \`attendance\`;`)
}
