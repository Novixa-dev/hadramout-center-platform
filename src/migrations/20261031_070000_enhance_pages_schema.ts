import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` ADD \`hero_layout\` text DEFAULT 'standard';`);
  await db.run(sql`ALTER TABLE \`pages\` ADD \`hero_image_id\` integer REFERENCES \`media\`(\`id\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`pages_hero_image_idx\` ON \`pages\` (\`hero_image_id\`);`);
  await db.run(sql`ALTER TABLE \`pages\` ADD \`schema_type\` text DEFAULT 'WebPage';`);
  await db.run(sql`ALTER TABLE \`pages\` ADD \`show_breadcrumbs\` numeric DEFAULT 1;`);
  await db.run(sql`ALTER TABLE \`pages\` ADD \`editorial_notes\` text;`);
  await db.run(sql`ALTER TABLE \`pages\` ADD \`scheduled_publish\` text;`);
  await db.run(sql`ALTER TABLE \`pages_locales\` ADD \`lead\` text;`);
  await db.run(sql`ALTER TABLE \`pages_locales\` ADD \`badge\` text;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_locales\` DROP COLUMN \`badge\`;`);
  await db.run(sql`ALTER TABLE \`pages_locales\` DROP COLUMN \`lead\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`pages_hero_image_idx\`;`);
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`scheduled_publish\`;`);
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`editorial_notes\`;`);
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`show_breadcrumbs\`;`);
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`schema_type\`;`);
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`hero_image_id\`;`);
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`hero_layout\`;`);
}
