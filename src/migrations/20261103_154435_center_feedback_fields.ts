import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

// Event type/attendance/participants/supporters, forum category, audio clips/series, video clips and announcement fields
// (Center feedback report 2026-10-27). The pages columns of the hand-written 20261031_070000 migration were already
// applied and are left out here; the JSON snapshot next to this file now records them, so the next diff starts clean.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`events_participants\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`role\` text DEFAULT 'speaker' NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_participants_order_idx\` ON \`events_participants\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`events_participants_parent_id_idx\` ON \`events_participants\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`events_participants_locales\` (
  	\`name\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events_participants\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`events_participants_locales_locale_parent_id_unique\` ON \`events_participants_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`events_participants_locales_parent_id_idx\` ON \`events_participants_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`events_supporters\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_supporters_order_idx\` ON \`events_supporters\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`events_supporters_parent_id_idx\` ON \`events_supporters\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`events_supporters_locales\` (
  	\`name\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events_supporters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`events_supporters_locales_locale_parent_id_unique\` ON \`events_supporters_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`events_supporters_locales_parent_id_idx\` ON \`events_supporters_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`forum_events_participants\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`role\` text DEFAULT 'speaker' NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forum_events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`forum_events_participants_order_idx\` ON \`forum_events_participants\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_participants_parent_id_idx\` ON \`forum_events_participants\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`forum_events_participants_locales\` (
  	\`name\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forum_events_participants\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`forum_events_participants_locales_locale_parent_id_unique\` ON \`forum_events_participants_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_participants_locales_parent_id_idx\` ON \`forum_events_participants_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`forum_events_supporters\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forum_events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`forum_events_supporters_order_idx\` ON \`forum_events_supporters\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_supporters_parent_id_idx\` ON \`forum_events_supporters\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`forum_events_supporters_locales\` (
  	\`name\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forum_events_supporters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`forum_events_supporters_locales_locale_parent_id_unique\` ON \`forum_events_supporters_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_supporters_locales_parent_id_idx\` ON \`forum_events_supporters_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`videos_clips\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`youtube_id\` text,
  	\`url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`videos\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`videos_clips_order_idx\` ON \`videos_clips\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`videos_clips_parent_id_idx\` ON \`videos_clips\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`videos_clips_locales\` (
  	\`title\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`videos_clips\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`videos_clips_locales_locale_parent_id_unique\` ON \`videos_clips_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`videos_clips_locales_parent_id_idx\` ON \`videos_clips_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`audio_clips\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`url\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`audio\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`audio_clips_order_idx\` ON \`audio_clips\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`audio_clips_parent_id_idx\` ON \`audio_clips\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`audio_clips_file_idx\` ON \`audio_clips\` (\`file_id\`);`)
  await db.run(sql`CREATE TABLE \`audio_clips_locales\` (
  	\`title\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`audio_clips\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`audio_clips_locales_locale_parent_id_unique\` ON \`audio_clips_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`audio_clips_locales_parent_id_idx\` ON \`audio_clips_locales\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`kind\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`mode\` text;`)
  await db.run(sql`CREATE INDEX \`events_kind_idx\` ON \`events\` (\`kind\`);`)
  await db.run(sql`ALTER TABLE \`forum_events\` ADD \`kind\` text;`)
  await db.run(sql`ALTER TABLE \`forum_events\` ADD \`mode\` text;`)
  await db.run(sql`ALTER TABLE \`forum_events\` ADD \`category_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`forum_events_kind_idx\` ON \`forum_events\` (\`kind\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_category_idx\` ON \`forum_events\` (\`category_id\`);`)
  await db.run(sql`ALTER TABLE \`audio\` ADD \`series\` text DEFAULT 'library';`)
  await db.run(sql`ALTER TABLE \`audio\` ADD \`episode\` numeric;`)
  await db.run(sql`CREATE INDEX \`audio_series_idx\` ON \`audio\` (\`series\`);`)
  await db.run(sql`ALTER TABLE \`audio_locales\` ADD \`excerpt\` text;`)
  await db.run(sql`ALTER TABLE \`announcements\` ADD \`kind\` text DEFAULT 'event';`)
  await db.run(sql`ALTER TABLE \`announcements\` ADD \`show_on_home\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`announcements\` ADD \`cover_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`announcements\` ADD \`link\` text;`)
  await db.run(sql`CREATE INDEX \`announcements_cover_idx\` ON \`announcements\` (\`cover_id\`);`)
  await db.run(sql`ALTER TABLE \`announcements_locales\` ADD \`excerpt\` text;`)
  await db.run(sql`ALTER TABLE \`announcements_locales\` ADD \`venue\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`events_participants\`;`)
  await db.run(sql`DROP TABLE \`events_participants_locales\`;`)
  await db.run(sql`DROP TABLE \`events_supporters\`;`)
  await db.run(sql`DROP TABLE \`events_supporters_locales\`;`)
  await db.run(sql`DROP TABLE \`forum_events_participants\`;`)
  await db.run(sql`DROP TABLE \`forum_events_participants_locales\`;`)
  await db.run(sql`DROP TABLE \`forum_events_supporters\`;`)
  await db.run(sql`DROP TABLE \`forum_events_supporters_locales\`;`)
  await db.run(sql`DROP TABLE \`videos_clips\`;`)
  await db.run(sql`DROP TABLE \`videos_clips_locales\`;`)
  await db.run(sql`DROP TABLE \`audio_clips\`;`)
  await db.run(sql`DROP TABLE \`audio_clips_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_forum_events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`cover_id\` integer,
  	\`cover_url\` text,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`featured\` integer DEFAULT false,
  	\`published_at\` text,
  	\`date_precision\` text DEFAULT 'day',
  	\`legacy_id\` numeric,
  	\`legacy_url\` text,
  	\`source\` text DEFAULT 'manual',
  	\`edited\` integer DEFAULT false,
  	\`translation_meta\` text,
  	\`event_date\` text,
  	\`end_date\` text,
  	\`youtube_id\` text,
  	\`link\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_forum_events\`("id", "cover_id", "cover_url", "status", "featured", "published_at", "date_precision", "legacy_id", "legacy_url", "source", "edited", "translation_meta", "event_date", "end_date", "youtube_id", "link", "updated_at", "created_at") SELECT "id", "cover_id", "cover_url", "status", "featured", "published_at", "date_precision", "legacy_id", "legacy_url", "source", "edited", "translation_meta", "event_date", "end_date", "youtube_id", "link", "updated_at", "created_at" FROM \`forum_events\`;`)
  await db.run(sql`DROP TABLE \`forum_events\`;`)
  await db.run(sql`ALTER TABLE \`__new_forum_events\` RENAME TO \`forum_events\`;`)
  await db.run(sql`CREATE INDEX \`forum_events_cover_idx\` ON \`forum_events\` (\`cover_id\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_status_idx\` ON \`forum_events\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_published_at_idx\` ON \`forum_events\` (\`published_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`forum_events_legacy_id_idx\` ON \`forum_events\` (\`legacy_id\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_updated_at_idx\` ON \`forum_events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`forum_events_created_at_idx\` ON \`forum_events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_announcements\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`pinned\` integer DEFAULT false,
  	\`attachment_id\` integer,
  	\`attachment_url\` text,
  	\`event_date\` text,
  	\`expires_at\` text,
  	\`published_at\` text,
  	\`status\` text DEFAULT 'published',
  	\`translation_meta\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`attachment_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_announcements\`("id", "pinned", "attachment_id", "attachment_url", "event_date", "expires_at", "published_at", "status", "translation_meta", "updated_at", "created_at") SELECT "id", "pinned", "attachment_id", "attachment_url", "event_date", "expires_at", "published_at", "status", "translation_meta", "updated_at", "created_at" FROM \`announcements\`;`)
  await db.run(sql`DROP TABLE \`announcements\`;`)
  await db.run(sql`ALTER TABLE \`__new_announcements\` RENAME TO \`announcements\`;`)
  await db.run(sql`CREATE INDEX \`announcements_attachment_idx\` ON \`announcements\` (\`attachment_id\`);`)
  await db.run(sql`CREATE INDEX \`announcements_updated_at_idx\` ON \`announcements\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`announcements_created_at_idx\` ON \`announcements\` (\`created_at\`);`)
  // foreign keys stay off until every rebuilt table is renamed back: DROP TABLE with them on cascades into the *_locales rows
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`DROP INDEX \`events_kind_idx\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`kind\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`mode\`;`)
  await db.run(sql`DROP INDEX \`audio_series_idx\`;`)
  await db.run(sql`ALTER TABLE \`audio\` DROP COLUMN \`series\`;`)
  await db.run(sql`ALTER TABLE \`audio\` DROP COLUMN \`episode\`;`)
  await db.run(sql`ALTER TABLE \`audio_locales\` DROP COLUMN \`excerpt\`;`)
  await db.run(sql`ALTER TABLE \`announcements_locales\` DROP COLUMN \`excerpt\`;`)
  await db.run(sql`ALTER TABLE \`announcements_locales\` DROP COLUMN \`venue\`;`)
}
