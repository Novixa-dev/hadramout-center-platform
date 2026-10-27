import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`articles\` ADD \`cover_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`articles\` ADD \`cover_url\` text;`)
  await db.run(sql`CREATE INDEX \`articles_cover_idx\` ON \`articles\` (\`cover_id\`);`)
  await db.run(sql`ALTER TABLE \`articles_locales\` ADD \`cover_alt\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_articles\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`featured\` integer DEFAULT false,
  	\`published_at\` text,
  	\`date_precision\` text DEFAULT 'day',
  	\`legacy_id\` numeric,
  	\`legacy_url\` text,
  	\`source\` text DEFAULT 'manual',
  	\`edited\` integer DEFAULT false,
  	\`translation_meta\` text,
  	\`category_id\` integer,
  	\`magazine_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`magazine_id\`) REFERENCES \`magazines\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_articles\`("id", "status", "featured", "published_at", "date_precision", "legacy_id", "legacy_url", "source", "edited", "translation_meta", "category_id", "magazine_id", "updated_at", "created_at") SELECT "id", "status", "featured", "published_at", "date_precision", "legacy_id", "legacy_url", "source", "edited", "translation_meta", "category_id", "magazine_id", "updated_at", "created_at" FROM \`articles\`;`)
  await db.run(sql`DROP TABLE \`articles\`;`)
  await db.run(sql`ALTER TABLE \`__new_articles\` RENAME TO \`articles\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`articles_status_idx\` ON \`articles\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`articles_published_at_idx\` ON \`articles\` (\`published_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`articles_legacy_id_idx\` ON \`articles\` (\`legacy_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_category_idx\` ON \`articles\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_magazine_idx\` ON \`articles\` (\`magazine_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_updated_at_idx\` ON \`articles\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`articles_created_at_idx\` ON \`articles\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`articles_locales\` DROP COLUMN \`cover_alt\`;`)
}
