import { TRANSLATABLE_EXTRA, type CollectionSlug } from '../../lib/content-types.ts';

/**
 * Which localized fields of which collection/global the translation engine handles,
 * and whether each holds plain text or sanitized HTML.
 */
export type TranslatableSlug = CollectionSlug | 'authors' | 'categories' | 'pages' | 'timeline' | 'media' | 'site';

export interface FieldSpec {
  name: string;
  format: 'text' | 'html';
}

const contentFields = (slug: CollectionSlug): FieldSpec[] => [
  { name: 'title', format: 'text' },
  { name: 'excerpt', format: 'text' },
  { name: 'body', format: 'html' },
  { name: 'coverAlt', format: 'text' },
  ...TRANSLATABLE_EXTRA[slug].map((name) => ({ name, format: 'text' as const })),
];

export const TRANSLATABLE: Record<TranslatableSlug, FieldSpec[]> = {
  news: contentFields('news'),
  articles: contentFields('articles'),
  books: contentFields('books'),
  magazines: contentFields('magazines'),
  events: contentFields('events'),
  'forum-events': contentFields('forum-events'),
  videos: contentFields('videos'),
  authors: [
    { name: 'name', format: 'text' },
    { name: 'bio', format: 'text' },
  ],
  categories: [{ name: 'name', format: 'text' }],
  pages: [
    { name: 'title', format: 'text' },
    { name: 'body', format: 'html' },
  ],
  timeline: [
    { name: 'title', format: 'text' },
    { name: 'era', format: 'text' },
    { name: 'body', format: 'text' },
  ],
  media: [{ name: 'alt', format: 'text' }],
  site: [
    { name: 'name', format: 'text' },
    { name: 'shortName', format: 'text' },
    { name: 'tagline', format: 'text' },
    { name: 'description', format: 'text' },
    { name: 'address', format: 'text' },
  ],
};

export function isTranslatableSlug(slug: string): slug is TranslatableSlug {
  return slug in TRANSLATABLE;
}

export const isGlobalSlug = (slug: TranslatableSlug): boolean => slug === 'site';

/** Context hint for the model per slug. */
export function contextFor(slug: TranslatableSlug): string {
  switch (slug) {
    case 'articles':
      return 'a scholarly historical study or essay about Hadhramout';
    case 'news':
      return 'a news report from a research center';
    case 'books':
      return 'a book description from a scholarly publisher';
    case 'magazines':
      return 'a magazine issue description and table of contents';
    case 'events':
    case 'forum-events':
      return 'an announcement of a lecture, seminar or conference';
    case 'authors':
      return 'names and short biographies of authors and scholars (transliterate names)';
    case 'timeline':
      return 'a short historical encyclopedia entry';
    default:
      return 'website text';
  }
}
