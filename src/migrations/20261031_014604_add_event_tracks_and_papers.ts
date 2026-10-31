import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`events_tracks\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_tracks_order_idx\` ON \`events_tracks\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`events_tracks_parent_id_idx\` ON \`events_tracks\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`events_tracks_locales\` (
  	\`title\` text NOT NULL,
  	\`description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events_tracks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`events_tracks_locales_locale_parent_id_unique\` ON \`events_tracks_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`events_tracks_locales_parent_id_idx\` ON \`events_tracks_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`events_papers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`file_url\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_papers_order_idx\` ON \`events_papers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`events_papers_parent_id_idx\` ON \`events_papers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`events_papers_file_idx\` ON \`events_papers\` (\`file_id\`);`)
  await db.run(sql`CREATE TABLE \`events_papers_locales\` (
  	\`title\` text NOT NULL,
  	\`researcher\` text NOT NULL,
  	\`abstract\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events_papers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`events_papers_locales_locale_parent_id_unique\` ON \`events_papers_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`events_papers_locales_parent_id_idx\` ON \`events_papers_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`forum_events_tracks\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forum_events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`forum_events_tracks_order_idx\` ON \`forum_events_tracks\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_tracks_parent_id_idx\` ON \`forum_events_tracks\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`forum_events_tracks_locales\` (
  	\`title\` text NOT NULL,
  	\`description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forum_events_tracks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`forum_events_tracks_locales_locale_parent_id_unique\` ON \`forum_events_tracks_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_tracks_locales_parent_id_idx\` ON \`forum_events_tracks_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`forum_events_papers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`file_url\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forum_events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`forum_events_papers_order_idx\` ON \`forum_events_papers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_papers_parent_id_idx\` ON \`forum_events_papers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_papers_file_idx\` ON \`forum_events_papers\` (\`file_id\`);`)
  await db.run(sql`CREATE TABLE \`forum_events_papers_locales\` (
  	\`title\` text NOT NULL,
  	\`researcher\` text NOT NULL,
  	\`abstract\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forum_events_papers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`forum_events_papers_locales_locale_parent_id_unique\` ON \`forum_events_papers_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_papers_locales_parent_id_idx\` ON \`forum_events_papers_locales\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`events_locales\` ADD \`chairs\` text;`)
  await db.run(sql`ALTER TABLE \`forum_events_locales\` ADD \`chairs\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`events_tracks\`;`)
  await db.run(sql`DROP TABLE \`events_tracks_locales\`;`)
  await db.run(sql`DROP TABLE \`events_papers\`;`)
  await db.run(sql`DROP TABLE \`events_papers_locales\`;`)
  await db.run(sql`DROP TABLE \`forum_events_tracks\`;`)
  await db.run(sql`DROP TABLE \`forum_events_tracks_locales\`;`)
  await db.run(sql`DROP TABLE \`forum_events_papers\`;`)
  await db.run(sql`DROP TABLE \`forum_events_papers_locales\`;`)
  await db.run(sql`ALTER TABLE \`events_locales\` DROP COLUMN \`chairs\`;`)
  await db.run(sql`ALTER TABLE \`forum_events_locales\` DROP COLUMN \`chairs\`;`)
}
