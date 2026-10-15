import type { ContentType } from './content-types.ts';
import type { Doc } from './data.ts';
import { authorsOf } from './ctx.ts';

interface Args {
  type: ContentType;
  doc: Doc;
  url: string;
  lang: string;
  image?: string | null;
  orgName: string;
  orgUrl: string;
}

/** schema.org JSON-LD for a content page (ScholarlyArticle, Book, PublicationIssue, NewsArticle, Event, VideoObject). */
export function contentJsonLd({ type, doc, url, lang, image, orgName, orgUrl }: Args): Record<string, unknown> {
  const publisher = { '@type': 'Organization', name: orgName, url: orgUrl };
  const authors = authorsOf(doc).map((a) => ({ '@type': 'Person', name: a.name }));
  const base = { '@context': 'https://schema.org', url, name: doc.title, headline: doc.title, inLanguage: lang, ...(image ? { image } : {}), ...(doc.excerpt ? { description: doc.excerpt } : {}) };
  const date = doc.datePrecision && !['estimated', 'none'].includes(doc.datePrecision) ? doc.publishedAt ?? undefined : undefined;
  switch (type) {
    case 'article':
      return { ...base, '@type': 'ScholarlyArticle', author: authors, publisher, ...(date ? { datePublished: date } : {}) };
    case 'news':
      return { ...base, '@type': 'NewsArticle', publisher, author: authors.length ? authors : publisher, ...(date ? { datePublished: date } : {}) };
    case 'book':
      return { ...base, '@type': 'Book', author: authors, publisher, ...(doc.year ? { datePublished: String(doc.year) } : {}), ...(doc.isbn ? { isbn: doc.isbn } : {}) };
    case 'magazine':
      return { ...base, '@type': 'PublicationIssue', issueNumber: doc.issueNumber, publisher, isPartOf: { '@type': 'Periodical', name: 'مجلة حضرموت الثقافية', publisher } };
    case 'event':
    case 'forum':
      return {
        ...base,
        '@type': 'Event',
        organizer: publisher,
        ...(doc.eventDate ? { startDate: String(doc.eventDate).slice(0, 10) } : {}),
        ...(doc.endDate ? { endDate: String(doc.endDate).slice(0, 10) } : {}),
        ...(doc.venue ? { location: { '@type': 'Place', name: doc.venue } } : {}),
        eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
      };
    case 'video':
      return { ...base, '@type': 'VideoObject', name: doc.title, description: doc.excerpt || doc.title, thumbnailUrl: image ?? undefined, ...(doc.youtubeId ? { embedUrl: `https://www.youtube-nocookie.com/embed/${doc.youtubeId}` } : {}), ...(date ? { uploadDate: date } : {}) };
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export function orgJsonLd(args: { name: string; url: string; email?: string; address?: string; logo: string; sameAs: string[] }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    name: args.name,
    url: args.url,
    logo: args.logo,
    ...(args.email ? { email: args.email } : {}),
    ...(args.address ? { address: { '@type': 'PostalAddress', streetAddress: args.address, addressCountry: 'YE' } } : {}),
    sameAs: args.sameAs,
  };
}

/** Safe to embed inside <script type="application/ld+json">. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
