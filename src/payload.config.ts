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
import { Audio } from './collections/Audio.ts';
import { Announcements } from './collections/Announcements.ts';
import { Partners } from './collections/Partners.ts';
import { Testimonials } from './collections/Testimonials.ts';
import { Site } from './globals/Site.ts';
import { TASKS } from './jobs/tasks.ts';
import { DEFAULT_LOCALE, PAYLOAD_LOCALES } from './i18n/locales.ts';
import { migrations } from './migrations/index.ts';
import { ADMIN_TRANSLATIONS } from './admin/i18n.ts';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' — مركز حضرموت',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/brand/logo-icon.svg' }],
    },
    // "28 October 2026 · 20:05" / «28 أكتوبر 2026 · 20:05»: one pattern for both languages (date-fns cannot vary it per
    // language); the default ("October 28th 2026, 8:05 PM") came out as «أكتوبر 28 ,2026 8:05 م» in Arabic.
    dateFormat: 'd MMMM yyyy · HH:mm',
    components: {
      graphics: { Logo: '/admin/Brand#Logo', Icon: '/admin/Brand#Icon' },
      actions: ['/admin/HeaderActions#HeaderActions'],
      beforeLogin: ['/admin/HeaderActions#LoginLanguage'],
      beforeDashboard: ['/admin/EditorialDashboard#EditorialDashboard'],
      // No email adapter is configured: Payload's own screen would promise a reset email that never leaves the server.
      views: { forgot: { Component: '/admin/ForgotPassword#ForgotPassword', path: '/forgot' } },
    },
  },
  i18n: { supportedLanguages: { ar, en }, fallbackLanguage: 'ar', translations: ADMIN_TRANSLATIONS },
  localization: { locales: PAYLOAD_LOCALES, defaultLocale: DEFAULT_LOCALE, fallback: true },
  collections: [News, Articles, Books, Magazines, Events, ForumEvents, Videos, Audio, Announcements, Partners, Testimonials, Authors, Categories, Pages, Timeline, Media, Glossary, Reviews, Messages, Subscribers, TranslationUsage, Users],
  globals: [Site],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  defaultMaxTextLength: 3_000_000,
  // The site reads content through the local API; the public GraphQL surface is not used, so it is switched off.
  graphQL: { disable: true },
  maxDepth: 3,
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
