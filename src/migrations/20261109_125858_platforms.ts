import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
import { reindexAll } from '../lib/reindex.ts'
import { PRIVACY_MARKER, PRIVACY_PLATFORMS_HTML, PRIVACY_SAVED_NEW, PRIVACY_SAVED_OLD } from '../seed/privacy-platforms.ts'

const PRIVACY_NEXT_HEADING = '<h2>الترجمة الآلية</h2>'
const PRIVACY_PAGE = sql`(SELECT id FROM pages WHERE slug = 'privacy')`

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`encyclopedia\` (
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
  	\`entry_kind\` text,
  	\`category_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`encyclopedia_cover_idx\` ON \`encyclopedia\` (\`cover_id\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_status_idx\` ON \`encyclopedia\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_published_at_idx\` ON \`encyclopedia\` (\`published_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`encyclopedia_legacy_id_idx\` ON \`encyclopedia\` (\`legacy_id\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_entry_kind_idx\` ON \`encyclopedia\` (\`entry_kind\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_category_idx\` ON \`encyclopedia\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_updated_at_idx\` ON \`encyclopedia\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_created_at_idx\` ON \`encyclopedia\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`encyclopedia_locales\` (
  	\`title\` text NOT NULL,
  	\`excerpt\` text,
  	\`body\` text,
  	\`cover_alt\` text,
  	\`sources\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`encyclopedia\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`encyclopedia_locales_locale_parent_id_unique\` ON \`encyclopedia_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_locales_parent_id_idx\` ON \`encyclopedia_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`encyclopedia_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`authors_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`encyclopedia\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`authors_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`encyclopedia_rels_order_idx\` ON \`encyclopedia_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_rels_parent_idx\` ON \`encyclopedia_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_rels_path_idx\` ON \`encyclopedia_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`encyclopedia_rels_authors_id_idx\` ON \`encyclopedia_rels\` (\`authors_id\`);`)
  await db.run(sql`CREATE TABLE \`orders_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`book_id\` integer,
  	\`title\` text,
  	\`quantity\` numeric NOT NULL,
  	FOREIGN KEY (\`book_id\`) REFERENCES \`books\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`orders_items_order_idx\` ON \`orders_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`orders_items_parent_id_idx\` ON \`orders_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`orders_items_book_idx\` ON \`orders_items\` (\`book_id\`);`)
  await db.run(sql`CREATE TABLE \`orders\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`reference\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`address\` text NOT NULL,
  	\`note\` text,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`member_id\` integer,
  	\`staff_notes\` text,
  	\`lang\` text,
  	\`ip_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`orders_reference_idx\` ON \`orders\` (\`reference\`);`)
  await db.run(sql`CREATE INDEX \`orders_status_idx\` ON \`orders\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`orders_member_idx\` ON \`orders\` (\`member_id\`);`)
  await db.run(sql`CREATE INDEX \`orders_updated_at_idx\` ON \`orders\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`orders_created_at_idx\` ON \`orders\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`pledges\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`reference\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`amount\` numeric,
  	\`currency\` text,
  	\`purpose\` text,
  	\`anonymous\` integer DEFAULT false,
  	\`note\` text,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`member_id\` integer,
  	\`staff_notes\` text,
  	\`lang\` text,
  	\`ip_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pledges_reference_idx\` ON \`pledges\` (\`reference\`);`)
  await db.run(sql`CREATE INDEX \`pledges_status_idx\` ON \`pledges\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`pledges_member_idx\` ON \`pledges\` (\`member_id\`);`)
  await db.run(sql`CREATE INDEX \`pledges_updated_at_idx\` ON \`pledges\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pledges_created_at_idx\` ON \`pledges\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`volunteers_areas\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`volunteers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`volunteers_areas_order_idx\` ON \`volunteers_areas\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`volunteers_areas_parent_idx\` ON \`volunteers_areas\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`volunteers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`reference\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`city\` text,
  	\`availability\` text,
  	\`experience\` text NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`member_id\` integer,
  	\`staff_notes\` text,
  	\`lang\` text,
  	\`ip_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`volunteers_reference_idx\` ON \`volunteers\` (\`reference\`);`)
  await db.run(sql`CREATE INDEX \`volunteers_status_idx\` ON \`volunteers\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`volunteers_member_idx\` ON \`volunteers\` (\`member_id\`);`)
  await db.run(sql`CREATE INDEX \`volunteers_updated_at_idx\` ON \`volunteers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`volunteers_created_at_idx\` ON \`volunteers\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`members\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`status\` text DEFAULT 'active' NOT NULL,
  	\`last_login_at\` text,
  	\`password_hash\` text,
  	\`session_version\` numeric DEFAULT 0,
  	\`saved_items\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`members_email_idx\` ON \`members\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`members_status_idx\` ON \`members\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`members_updated_at_idx\` ON \`members\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`members_created_at_idx\` ON \`members\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`books\` ADD \`store_status\` text DEFAULT 'on_request';`)
  await db.run(sql`ALTER TABLE \`books\` ADD \`price\` numeric;`)
  await db.run(sql`ALTER TABLE \`books\` ADD \`currency\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`encyclopedia_id\` integer REFERENCES encyclopedia(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`orders_id\` integer REFERENCES orders(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`pledges_id\` integer REFERENCES pledges(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`volunteers_id\` integer REFERENCES volunteers(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`members_id\` integer REFERENCES members(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_encyclopedia_id_idx\` ON \`payload_locked_documents_rels\` (\`encyclopedia_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pledges_id_idx\` ON \`payload_locked_documents_rels\` (\`pledges_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_volunteers_id_idx\` ON \`payload_locked_documents_rels\` (\`volunteers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_members_id_idx\` ON \`payload_locked_documents_rels\` (\`members_id\`);`)
  await db.run(sql`ALTER TABLE \`site\` ADD \`donation_payment_url\` text;`)
  await db.run(sql`ALTER TABLE \`site_locales\` ADD \`donation_instructions\` text;`)

  // The privacy page must say what the new forms keep. Only the seeded wording is touched: text an editor rewrote is left alone.
  const section = `${PRIVACY_PLATFORMS_HTML}\n${PRIVACY_NEXT_HEADING}`
  await db.run(sql`UPDATE pages_locales SET
      body = replace(replace(body, ${PRIVACY_NEXT_HEADING}, ${section}), ${PRIVACY_SAVED_OLD}, ${PRIVACY_SAVED_NEW})
    WHERE _locale = 'ar' AND _parent_id = ${PRIVACY_PAGE} AND instr(body, ${PRIVACY_MARKER}) = 0 AND instr(body, ${PRIVACY_NEXT_HEADING}) > 0`)
  const { rows } = await db.run(sql`SELECT 1 FROM pages_locales WHERE _locale = 'ar' AND _parent_id = ${PRIVACY_PAGE} AND instr(body, ${PRIVACY_MARKER}) = 0`)
  if (rows.length) payload.logger.warn('platforms: the privacy page was edited, so it was not updated. Add the section on member accounts and requests by hand.')

  // The index walks every content type, the encyclopedia now included, so on a database behind by several migrations the book records'
  // rebuild could not run before this table existed. It runs here instead; a fresh database has nothing to index yet.
  try {
    await reindexAll(payload)
  } catch (err) {
    payload.logger.warn(`platforms: search index not rebuilt (${String(err)}); run: npm run db:seed -- --defaults-only`)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`UPDATE pages_locales SET
      body = replace(replace(body, ${`${PRIVACY_PLATFORMS_HTML}\n`}, ''), ${PRIVACY_SAVED_NEW}, ${PRIVACY_SAVED_OLD})
    WHERE _locale = 'ar' AND _parent_id = ${PRIVACY_PAGE}`)
  await db.run(sql`DROP TABLE \`encyclopedia\`;`)
  await db.run(sql`DROP TABLE \`encyclopedia_locales\`;`)
  await db.run(sql`DROP TABLE \`encyclopedia_rels\`;`)
  await db.run(sql`DROP TABLE \`orders_items\`;`)
  await db.run(sql`DROP TABLE \`orders\`;`)
  await db.run(sql`DROP TABLE \`pledges\`;`)
  await db.run(sql`DROP TABLE \`volunteers_areas\`;`)
  await db.run(sql`DROP TABLE \`volunteers\`;`)
  await db.run(sql`DROP TABLE \`members\`;`)
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
  	FOREIGN KEY (\`translation_usage_id\`) REFERENCES \`translation_usage\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "news_id", "articles_id", "books_id", "magazines_id", "events_id", "forum_events_id", "videos_id", "audio_id", "announcements_id", "partners_id", "testimonials_id", "authors_id", "categories_id", "pages_id", "timeline_id", "media_id", "glossary_id", "reviews_id", "messages_id", "subscribers_id", "translation_usage_id", "users_id") SELECT "id", "order", "parent_id", "path", "news_id", "articles_id", "books_id", "magazines_id", "events_id", "forum_events_id", "videos_id", "audio_id", "announcements_id", "partners_id", "testimonials_id", "authors_id", "categories_id", "pages_id", "timeline_id", "media_id", "glossary_id", "reviews_id", "messages_id", "subscribers_id", "translation_usage_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_translation_usage_id_idx\` ON \`payload_locked_documents_rels\` (\`translation_usage_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`ALTER TABLE \`books\` DROP COLUMN \`store_status\`;`)
  await db.run(sql`ALTER TABLE \`books\` DROP COLUMN \`price\`;`)
  await db.run(sql`ALTER TABLE \`books\` DROP COLUMN \`currency\`;`)
  await db.run(sql`ALTER TABLE \`site\` DROP COLUMN \`donation_payment_url\`;`)
  await db.run(sql`ALTER TABLE \`site_locales\` DROP COLUMN \`donation_instructions\`;`)
}
