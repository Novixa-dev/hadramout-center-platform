export const POST_TYPES = ['news', 'article', 'book', 'magazine', 'event', 'forum', 'video'] as const;
export type PostType = (typeof POST_TYPES)[number];
export type PostStatus = 'draft' | 'published' | 'archived';
export type DatePrecision = 'day' | 'month' | 'year' | 'estimated' | 'none';

export interface AuthorRef {
  id: number;
  name: string;
}

export interface TermRef {
  id: number;
  taxonomy: string;
  name: string;
}

/** How a record is presented in the visitor's language. Attached by TranslationService.localize*. */
export interface TrState {
  /** requested language */
  lang: string;
  status: 'source' | 'complete' | 'partial' | 'missing';
  /** language each text field is actually shown in ('ar' when it fell back to the Arabic source) */
  titleLang: string;
  excerptLang: string;
  bodyLang: string;
  machine: boolean;
  reviewed: boolean;
  pending: boolean;
}

export interface Post {
  id: number;
  type: PostType;
  status: PostStatus;
  title: string;
  excerpt: string;
  body: string;
  cover: string | null;
  coverAlt: string;
  publishedAt: string | null;
  datePrecision: DatePrecision;
  fields: Record<string, string>;
  data: Record<string, unknown>;
  featured: boolean;
  views: number;
  legacyUrl: string | null;
  source: 'manual' | 'legacy';
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  authors: AuthorRef[];
  terms: TermRef[];
  tr?: TrState;
}

export interface PostRow {
  id: number;
  type: PostType;
  status: PostStatus;
  title: string;
  excerpt: string;
  body: string;
  cover: string | null;
  cover_alt: string;
  published_at: string | null;
  date_precision: DatePrecision;
  fields: string;
  data: string;
  featured: number;
  views: number;
  legacy_url: string | null;
  source: 'manual' | 'legacy';
  edited: number;
  created_at: string;
  updated_at: string;
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === 'object' ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export function rowToPost(r: PostRow): Post {
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    cover: r.cover,
    coverAlt: r.cover_alt,
    publishedAt: r.published_at,
    datePrecision: r.date_precision,
    fields: parseJson<Record<string, string>>(r.fields, {}),
    data: parseJson<Record<string, unknown>>(r.data, {}),
    featured: r.featured === 1,
    views: r.views,
    legacyUrl: r.legacy_url,
    source: r.source,
    edited: r.edited === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    authors: [],
    terms: [],
  };
}

/** Fields of `fields` JSON that are shown to readers and therefore translated. */
export const TRANSLATABLE_FIELD_KEYS = ['author', 'publisher', 'edition', 'dateline', 'speaker', 'moderator', 'venue', 'time_text', 'guest', 'editor_note'] as const;

export interface PostInput {
  type: PostType;
  status?: PostStatus;
  title: string;
  excerpt?: string;
  body?: string;
  cover?: string | null;
  coverAlt?: string;
  publishedAt?: string | null;
  datePrecision?: DatePrecision;
  fields?: Record<string, string>;
  data?: Record<string, unknown>;
  featured?: boolean;
  authors?: string[];
  terms?: { taxonomy: string; name: string }[];
}

export interface PageRow {
  id: number;
  slug: string;
  title: string;
  body: string;
  status: 'draft' | 'published';
  updated_at: string;
}
