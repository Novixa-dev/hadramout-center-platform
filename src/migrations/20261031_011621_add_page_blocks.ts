import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`image_url\` text,
  	\`cta_url\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_image_idx\` ON \`pages_blocks_hero\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_locales\` (
  	\`eyebrow\` text,
  	\`heading\` text NOT NULL,
  	\`lead\` text,
  	\`image_alt\` text,
  	\`cta_label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_hero_locales_locale_parent_id_unique\` ON \`pages_blocks_hero_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_locales_parent_id_idx\` ON \`pages_blocks_hero_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_order_idx\` ON \`pages_blocks_rich_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_parent_id_idx\` ON \`pages_blocks_rich_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_path_idx\` ON \`pages_blocks_rich_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_rich_text_locales\` (
  	\`content\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_rich_text\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_rich_text_locales_locale_parent_id_unique\` ON \`pages_blocks_rich_text_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_locales_parent_id_idx\` ON \`pages_blocks_rich_text_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_section_heading\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`align\` text DEFAULT 'start',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_section_heading_order_idx\` ON \`pages_blocks_section_heading\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_section_heading_parent_id_idx\` ON \`pages_blocks_section_heading\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_section_heading_path_idx\` ON \`pages_blocks_section_heading\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_section_heading_locales\` (
  	\`title\` text NOT NULL,
  	\`subtitle\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_section_heading\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_section_heading_locales_locale_parent_id_unique\` ON \`pages_blocks_section_heading_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_section_heading_locales_parent_id_idx\` ON \`pages_blocks_section_heading_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_text_with_image\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`image_url\` text,
  	\`image_position\` text DEFAULT 'end',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_with_image_order_idx\` ON \`pages_blocks_text_with_image\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_with_image_parent_id_idx\` ON \`pages_blocks_text_with_image\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_with_image_path_idx\` ON \`pages_blocks_text_with_image\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_with_image_image_idx\` ON \`pages_blocks_text_with_image\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_text_with_image_locales\` (
  	\`title\` text,
  	\`body\` text NOT NULL,
  	\`image_alt\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_text_with_image\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_text_with_image_locales_locale_parent_id_unique\` ON \`pages_blocks_text_with_image_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_with_image_locales_parent_id_idx\` ON \`pages_blocks_text_with_image_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_card_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`link\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_card_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_card_grid_items_order_idx\` ON \`pages_blocks_card_grid_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_card_grid_items_parent_id_idx\` ON \`pages_blocks_card_grid_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_card_grid_items_locales\` (
  	\`title\` text NOT NULL,
  	\`description\` text,
  	\`badge\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_card_grid_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_card_grid_items_locales_locale_parent_id_unique\` ON \`pages_blocks_card_grid_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_card_grid_items_locales_parent_id_idx\` ON \`pages_blocks_card_grid_items_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_card_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`columns\` text DEFAULT '3',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_card_grid_order_idx\` ON \`pages_blocks_card_grid\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_card_grid_parent_id_idx\` ON \`pages_blocks_card_grid\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_card_grid_path_idx\` ON \`pages_blocks_card_grid\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_card_grid_locales\` (
  	\`title\` text,
  	\`subtitle\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_card_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_card_grid_locales_locale_parent_id_unique\` ON \`pages_blocks_card_grid_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_card_grid_locales_parent_id_idx\` ON \`pages_blocks_card_grid_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_quote_callout\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`style\` text DEFAULT 'heritage',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_callout_order_idx\` ON \`pages_blocks_quote_callout\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_callout_parent_id_idx\` ON \`pages_blocks_quote_callout\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_callout_path_idx\` ON \`pages_blocks_quote_callout\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_quote_callout_locales\` (
  	\`quote\` text NOT NULL,
  	\`attribution\` text,
  	\`source\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_quote_callout\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_quote_callout_locales_locale_parent_id_unique\` ON \`pages_blocks_quote_callout_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_callout_locales_parent_id_idx\` ON \`pages_blocks_quote_callout_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_media_embed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`audio_url\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_embed_order_idx\` ON \`pages_blocks_media_embed\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_embed_parent_id_idx\` ON \`pages_blocks_media_embed\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_embed_path_idx\` ON \`pages_blocks_media_embed\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_media_embed_locales\` (
  	\`title\` text,
  	\`transcript\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_media_embed\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_media_embed_locales_locale_parent_id_unique\` ON \`pages_blocks_media_embed_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_embed_locales_parent_id_idx\` ON \`pages_blocks_media_embed_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_file_download\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`file_url\` text,
  	\`file_size\` text,
  	\`file_type\` text DEFAULT 'PDF',
  	\`block_name\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_file_download_order_idx\` ON \`pages_blocks_file_download\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_file_download_parent_id_idx\` ON \`pages_blocks_file_download\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_file_download_path_idx\` ON \`pages_blocks_file_download\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_file_download_file_idx\` ON \`pages_blocks_file_download\` (\`file_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_file_download_locales\` (
  	\`title\` text NOT NULL,
  	\`description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_file_download\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_file_download_locales_locale_parent_id_unique\` ON \`pages_blocks_file_download_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_file_download_locales_parent_id_idx\` ON \`pages_blocks_file_download_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_stats_strip_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_stats_strip\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_stats_strip_items_order_idx\` ON \`pages_blocks_stats_strip_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stats_strip_items_parent_id_idx\` ON \`pages_blocks_stats_strip_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_stats_strip_items_locales\` (
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_stats_strip_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_stats_strip_items_locales_locale_parent_id_uniq\` ON \`pages_blocks_stats_strip_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stats_strip_items_locales_parent_id_idx\` ON \`pages_blocks_stats_strip_items_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_stats_strip\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_stats_strip_order_idx\` ON \`pages_blocks_stats_strip\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stats_strip_parent_id_idx\` ON \`pages_blocks_stats_strip\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stats_strip_path_idx\` ON \`pages_blocks_stats_strip\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_accordion_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_accordion_faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_faq_items_order_idx\` ON \`pages_blocks_accordion_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_faq_items_parent_id_idx\` ON \`pages_blocks_accordion_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_accordion_faq_items_locales\` (
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_accordion_faq_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_accordion_faq_items_locales_locale_parent_id_un\` ON \`pages_blocks_accordion_faq_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_faq_items_locales_parent_id_idx\` ON \`pages_blocks_accordion_faq_items_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_accordion_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_faq_order_idx\` ON \`pages_blocks_accordion_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_faq_parent_id_idx\` ON \`pages_blocks_accordion_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_faq_path_idx\` ON \`pages_blocks_accordion_faq\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_accordion_faq_locales\` (
  	\`title\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_accordion_faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_accordion_faq_locales_locale_parent_id_unique\` ON \`pages_blocks_accordion_faq_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_faq_locales_parent_id_idx\` ON \`pages_blocks_accordion_faq_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_cta_box\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`button_url\` text NOT NULL,
  	\`secondary_button_url\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_box_order_idx\` ON \`pages_blocks_cta_box\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_box_parent_id_idx\` ON \`pages_blocks_cta_box\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_box_path_idx\` ON \`pages_blocks_cta_box\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_cta_box_locales\` (
  	\`title\` text NOT NULL,
  	\`text\` text,
  	\`button_label\` text NOT NULL,
  	\`secondary_button_label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_cta_box\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_blocks_cta_box_locales_locale_parent_id_unique\` ON \`pages_blocks_cta_box_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_box_locales_parent_id_idx\` ON \`pages_blocks_cta_box_locales\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`og_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`noindex\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`canonical_url\` text;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`nav_placement\` text DEFAULT 'none';`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`nav_order\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`published_at\` text;`)
  await db.run(sql`CREATE INDEX \`pages_og_image_idx\` ON \`pages\` (\`og_image_id\`);`)
  await db.run(sql`ALTER TABLE \`pages_locales\` ADD \`meta_title\` text;`)
  await db.run(sql`ALTER TABLE \`pages_locales\` ADD \`meta_description\` text;`)
  await db.run(sql`ALTER TABLE \`pages_locales\` ADD \`nav_label\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_rich_text_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_section_heading\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_section_heading_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_text_with_image\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_text_with_image_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_card_grid_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_card_grid_items_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_card_grid\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_card_grid_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_quote_callout\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_quote_callout_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_media_embed\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_media_embed_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_file_download\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_file_download_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_stats_strip_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_stats_strip_items_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_stats_strip\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_accordion_faq_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_accordion_faq_items_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_accordion_faq\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_accordion_faq_locales\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_cta_box\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_cta_box_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text NOT NULL,
  	\`status\` text DEFAULT 'published' NOT NULL,
  	\`translation_meta\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages\`("id", "slug", "status", "translation_meta", "updated_at", "created_at") SELECT "id", "slug", "status", "translation_meta", "updated_at", "created_at" FROM \`pages\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages\` RENAME TO \`pages\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`pages_locales\` DROP COLUMN \`meta_title\`;`)
  await db.run(sql`ALTER TABLE \`pages_locales\` DROP COLUMN \`meta_description\`;`)
  await db.run(sql`ALTER TABLE \`pages_locales\` DROP COLUMN \`nav_label\`;`)
}
