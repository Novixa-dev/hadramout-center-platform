/**
 * The content types of the archive: legacy section, Payload collection slug, public URL segment.
 * One registry so routes, importer, sitemap and search never disagree.
 */
export const CONTENT_TYPES = ['news', 'article', 'book', 'magazine', 'event', 'forum', 'video', 'encyclopedia'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export type CollectionSlug = 'news' | 'articles' | 'books' | 'magazines' | 'events' | 'forum-events' | 'videos' | 'encyclopedia';

export interface ContentTypeInfo {
  type: ContentType;
  /** Payload collection slug */
  slug: CollectionSlug;
  /** public URL segment: /{locale}/{route}/{id} */
  route: string;
  /** legacy site section (hadramout.center/{legacy}/{id}) */
  legacy: string;
}

export const CONTENT: Record<ContentType, ContentTypeInfo> = {
  news: { type: 'news', slug: 'news', route: 'news', legacy: 'news' },
  article: { type: 'article', slug: 'articles', route: 'articles', legacy: 'articles' },
  book: { type: 'book', slug: 'books', route: 'books', legacy: 'books' },
  magazine: { type: 'magazine', slug: 'magazines', route: 'magazines', legacy: 'magazines' },
  event: { type: 'event', slug: 'events', route: 'events', legacy: 'events' },
  forum: { type: 'forum', slug: 'forum-events', route: 'forum', legacy: 'forum' },
  video: { type: 'video', slug: 'videos', route: 'videos', legacy: 'videos' },
  // born here: the old site had no encyclopedia, so `legacy` names no real section
  encyclopedia: { type: 'encyclopedia', slug: 'encyclopedia', route: 'encyclopedia', legacy: 'encyclopedia' },
};

export const COLLECTION_SLUGS = CONTENT_TYPES.map((t) => CONTENT[t].slug);

export function typeFromSlug(slug: string): ContentTypeInfo | undefined {
  return CONTENT_TYPES.map((t) => CONTENT[t]).find((c) => c.slug === slug);
}

export function typeFromRoute(route: string): ContentTypeInfo | undefined {
  return CONTENT_TYPES.map((t) => CONTENT[t]).find((c) => c.route === route);
}

/** Localized text fields that the translation engine handles, per collection (plus title/excerpt/body everywhere). */
export const TRANSLATABLE_EXTRA: Record<CollectionSlug, string[]> = {
  news: ['dateline'],
  articles: [],
  books: ['publisher', 'edition', 'editor', 'translator'],
  magazines: ['season'],
  events: ['speaker', 'moderator', 'venue', 'timeText'],
  'forum-events': ['speaker', 'moderator', 'venue', 'timeText'],
  videos: ['guest'],
  encyclopedia: ['sources'],
};
