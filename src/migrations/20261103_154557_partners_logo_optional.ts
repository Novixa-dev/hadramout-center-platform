import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_partners\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`category\` text DEFAULT 'academic',
  	\`logo_id\` integer,
  	\`website\` text,
  	\`has_written_consent\` integer DEFAULT false,
  	\`order\` numeric DEFAULT 10,
  	\`status\` text DEFAULT 'draft',
  	\`translation_meta\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_partners\`("id", "category", "logo_id", "website", "has_written_consent", "order", "status", "translation_meta", "updated_at", "created_at") SELECT "id", "category", "logo_id", "website", "has_written_consent", "order", "status", "translation_meta", "updated_at", "created_at" FROM \`partners\`;`)
  await db.run(sql`DROP TABLE \`partners\`;`)
  await db.run(sql`ALTER TABLE \`__new_partners\` RENAME TO \`partners\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`partners_logo_idx\` ON \`partners\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`partners_updated_at_idx\` ON \`partners\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`partners_created_at_idx\` ON \`partners\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_partners\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`category\` text DEFAULT 'academic',
  	\`logo_id\` integer NOT NULL,
  	\`website\` text,
  	\`has_written_consent\` integer DEFAULT false,
  	\`order\` numeric DEFAULT 10,
  	\`status\` text DEFAULT 'draft',
  	\`translation_meta\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_partners\`("id", "category", "logo_id", "website", "has_written_consent", "order", "status", "translation_meta", "updated_at", "created_at") SELECT "id", "category", "logo_id", "website", "has_written_consent", "order", "status", "translation_meta", "updated_at", "created_at" FROM \`partners\`;`)
  await db.run(sql`DROP TABLE \`partners\`;`)
  await db.run(sql`ALTER TABLE \`__new_partners\` RENAME TO \`partners\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`partners_logo_idx\` ON \`partners\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`partners_updated_at_idx\` ON \`partners\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`partners_created_at_idx\` ON \`partners\` (\`created_at\`);`)
}
