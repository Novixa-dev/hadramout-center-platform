import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { ar } from '@payloadcms/translations/languages/ar';
import { en } from '@payloadcms/translations/languages/en';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { Users } from './collections/Users.ts';
import { Media } from './collections/Media.ts';
import { Authors } from './collections/Authors.ts';
import { Categories } from './collections/Categories.ts';
import { News, Articles, Books, Magazines, Events, ForumEvents, Videos } from './collections/content.ts';
import { Pages } from './collections/Pages.ts';
import { Timeline } from './collections/Timeline.ts';
import { Reviews } from './collections/Reviews.ts';
import { Glossary } from './collections/Glossary.ts';
import { Messages, Subscribers, TranslationUsage } from './collections/Forms.ts';
import { Site } from './globals/Site.ts';
import { TASKS } from './jobs/tasks.ts';
import { DEFAULT_LOCALE, PAYLOAD_LOCALES } from './i18n/locales.ts';
import { migrations } from './migrations/index.ts';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — مركز حضرموت' },
  },
  i18n: { supportedLanguages: { ar, en }, fallbackLanguage: 'ar' },
  localization: { locales: PAYLOAD_LOCALES, defaultLocale: DEFAULT_LOCALE, fallback: true },
  collections: [News, Articles, Books, Magazines, Events, ForumEvents, Videos, Authors, Categories, Pages, Timeline, Media, Glossary, Reviews, Messages, Subscribers, TranslationUsage, Users],
  globals: [Site],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  defaultMaxTextLength: 3_000_000,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URL || 'file:./data/payload.db' },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
    logger: process.env.HC_SQL_LOG === '1',
  }),
  jobs: {
    tasks: TASKS,
    deleteJobOnComplete: true,

  },
  sharp,
  plugins: [],
});
