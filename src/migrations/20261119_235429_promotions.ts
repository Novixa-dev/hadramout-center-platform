import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

// Promotions ("ads"): src/collections/Promotions.ts. Also catches up a schema drift: receipts were set to
// `focalPoint: false` on 2026-11-12 after their table was created, so their two unused focal columns go (down restores them).

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`promotions_targeting_pages\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`promotions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`promotions_targeting_pages_order_idx\` ON \`promotions_targeting_pages\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`promotions_targeting_pages_parent_idx\` ON \`promotions_targeting_pages\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`promotions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`cta_url\` text,
  	\`image_id\` integer,
  	\`targeting_device\` text DEFAULT 'all' NOT NULL,
  	\`behaviour_dismissible\` integer DEFAULT true,
  	\`behaviour_hide_days\` numeric DEFAULT 7 NOT NULL,
  	\`behaviour_frequency\` text DEFAULT 'once' NOT NULL,
  	\`behaviour_trigger\` text DEFAULT 'delay' NOT NULL,
  	\`behaviour_delay\` numeric DEFAULT 8 NOT NULL,
  	\`format\` text DEFAULT 'card' NOT NULL,
  	\`kind\` text DEFAULT 'event' NOT NULL,
  	\`tone\` text DEFAULT 'brand' NOT NULL,
  	\`start_at\` text NOT NULL,
  	\`end_at\` text,
  	\`priority\` numeric DEFAULT 0 NOT NULL,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`translation_meta\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`promotions_image_idx\` ON \`promotions\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`promotions_updated_at_idx\` ON \`promotions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`promotions_created_at_idx\` ON \`promotions\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`promotions_locales\` (
  	\`headline\` text NOT NULL,
  	\`text\` text,
  	\`cta_label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`promotions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`promotions_locales_locale_parent_id_unique\` ON \`promotions_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`promotions_locales_parent_id_idx\` ON \`promotions_locales\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`promotions_id\` integer REFERENCES promotions(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_promotions_id_idx\` ON \`payload_locked_documents_rels\` (\`promotions_id\`);`)
  await db.run(sql`ALTER TABLE \`receipts\` DROP COLUMN \`focal_x\`;`)
  await db.run(sql`ALTER TABLE \`receipts\` DROP COLUMN \`focal_y\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`promotions_targeting_pages\`;`)
  await db.run(sql`DROP TABLE \`promotions\`;`)
  await db.run(sql`DROP TABLE \`promotions_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`news_id\` integer,
  	\`articles_id\` integer,
  	\`books_id\` integer,
  	\`magazines_id\` integer,
  	\`events_id\` integer,
  	\`forum_events_id\` integer,
  	\`videos_id\` integer,
  	\`encyclopedia_id\` integer,
  	\`audio_id\` integer,
  	\`announcements_id\` integer,
  	\`partners_id\` integer,
  	\`testimonials_id\` integer,
  	\`authors_id\` integer,
  	\`categories_id\` integer,
  	\`pages_id\` integer,
  	\`timeline_id\` integer,
  	\`media_id\` integer,
  	\`glossary_id\` integer,
  	\`reviews_id\` integer,
  	\`messages_id\` integer,
  	\`subscribers_id\` integer,
  	\`orders_id\` integer,
  	\`pledges_id\` integer,
  	\`receipts_id\` integer,
  	\`volunteers_id\` integer,
  	\`members_id\` integer,
  	\`translation_usage_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`news_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`books_id\`) REFERENCES \`books\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`magazines_id\`) REFERENCES \`magazines\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forum_events_id\`) REFERENCES \`forum_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`videos_id\`) REFERENCES \`videos\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`encyclopedia_id\`) REFERENCES \`encyclopedia\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`audio_id\`) REFERENCES \`audio\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`announcements_id\`) REFERENCES \`announcements\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`partners_id\`) REFERENCES \`partners\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`authors_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`timeline_id\`) REFERENCES \`timeline\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`glossary_id\`) REFERENCES \`glossary\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`reviews_id\`) REFERENCES \`reviews\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`messages_id\`) REFERENCES \`messages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`subscribers_id\`) REFERENCES \`subscribers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`orders_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pledges_id\`) REFERENCES \`pledges\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`receipts_id\`) REFERENCES \`receipts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`volunteers_id\`) REFERENCES \`volunteers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`members_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`translation_usage_id\`) REFERENCES \`translation_usage\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "news_id", "articles_id", "books_id", "magazines_id", "events_id", "forum_events_id", "videos_id", "encyclopedia_id", "audio_id", "announcements_id", "partners_id", "testimonials_id", "authors_id", "categories_id", "pages_id", "timeline_id", "media_id", "glossary_id", "reviews_id", "messages_id", "subscribers_id", "orders_id", "pledges_id", "receipts_id", "volunteers_id", "members_id", "translation_usage_id", "users_id") SELECT "id", "order", "parent_id", "path", "news_id", "articles_id", "books_id", "magazines_id", "events_id", "forum_events_id", "videos_id", "encyclopedia_id", "audio_id", "announcements_id", "partners_id", "testimonials_id", "authors_id", "categories_id", "pages_id", "timeline_id", "media_id", "glossary_id", "reviews_id", "messages_id", "subscribers_id", "orders_id", "pledges_id", "receipts_id", "volunteers_id", "members_id", "translation_usage_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_news_id_idx\` ON \`payload_locked_documents_rels\` (\`news_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_books_id_idx\` ON \`payload_locked_documents_rels\` (\`books_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_magazines_id_idx\` ON \`payload_locked_documents_rels\` (\`magazines_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_forum_events_id_idx\` ON \`payload_locked_documents_rels\` (\`forum_events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_videos_id_idx\` ON \`payload_locked_documents_rels\` (\`videos_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_encyclopedia_id_idx\` ON \`payload_locked_documents_rels\` (\`encyclopedia_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_audio_id_idx\` ON \`payload_locked_documents_rels\` (\`audio_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_announcements_id_idx\` ON \`payload_locked_documents_rels\` (\`announcements_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partners_id_idx\` ON \`payload_locked_documents_rels\` (\`partners_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_testimonials_id_idx\` ON \`payload_locked_documents_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_authors_id_idx\` ON \`payload_locked_documents_rels\` (\`authors_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_timeline_id_idx\` ON \`payload_locked_documents_rels\` (\`timeline_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_glossary_id_idx\` ON \`payload_locked_documents_rels\` (\`glossary_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_reviews_id_idx\` ON \`payload_locked_documents_rels\` (\`reviews_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_messages_id_idx\` ON \`payload_locked_documents_rels\` (\`messages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subscribers_id_idx\` ON \`payload_locked_documents_rels\` (\`subscribers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pledges_id_idx\` ON \`payload_locked_documents_rels\` (\`pledges_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_receipts_id_idx\` ON \`payload_locked_documents_rels\` (\`receipts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_volunteers_id_idx\` ON \`payload_locked_documents_rels\` (\`volunteers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_members_id_idx\` ON \`payload_locked_documents_rels\` (\`members_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_translation_usage_id_idx\` ON \`payload_locked_documents_rels\` (\`translation_usage_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`ALTER TABLE \`receipts\` ADD \`focal_x\` numeric;`)
  await db.run(sql`ALTER TABLE \`receipts\` ADD \`focal_y\` numeric;`)
}
