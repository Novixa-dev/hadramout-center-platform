import type { ContentType } from './content-types.ts';
import { PERIODICAL_NAME } from './periodical.ts';
import type { Doc } from './data.ts';
import { authorsOf } from './ctx.ts';
import { isoOrUndefined, stripReferenceLine } from './seo-text.ts';

/**
 * schema.org JSON-LD. Only facts that are also visible on the page are emitted; unknown values are omitted,
 * never guessed (no fake ratings, dates, venues or attendance modes).
 */

export interface OrgRef {
  name: string;
  /** origin without trailing slash, e.g. https://hadramout.center */
  origin: string;
  logo: string;
}

const orgId = (o: OrgRef) => `${o.origin}/#organization`;
const publisherRef = (o: OrgRef) => ({ '@type': 'Organization', '@id': orgId(o), name: o.name, logo: { '@type': 'ImageObject', url: o.logo } });

interface Args {
  type: ContentType;
  doc: Doc;
  url: string;
  lang: string;
  image?: string | null;
  org: OrgRef;
  /** absolute URL of an author page */
  authorUrl: (id: number) => string;
  /** absolute URL of the PDF, when the document has one */
  pdf?: string | null;
  /** parent magazine issue (for articles published in an issue) */
  issue?: { name: string; url: string } | null;
  category?: string | null;
  /** real, approved reader ratings (only passed when there are enough of them) */
  rating?: { value: number; count: number } | null;
}

/** JSON-LD for a content page (ScholarlyArticle, Book, PublicationIssue, NewsArticle, Event, VideoObject). */
export function contentJsonLd({ type, doc, url, lang, image, org, authorUrl, pdf, issue, category, rating }: Args): Record<string, unknown> {
  const publisher = publisherRef(org);
  const authors = authorsOf(doc).map((a) => ({ '@type': 'Person', name: a.name, url: authorUrl(a.id) }));
  const date = doc.datePrecision && !['estimated', 'none'].includes(doc.datePrecision) ? isoOrUndefined(doc.publishedAt) : undefined;
  const modified = isoOrUndefined(doc.updatedAt);
  const summary = stripReferenceLine(doc.excerpt).trim();
  const base = {
    '@context': 'https://schema.org',
    '@id': `${url}#content`,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    name: doc.title,
    headline: doc.title.slice(0, 110),
    inLanguage: lang,
    isAccessibleForFree: true,
    ...(image ? { image: [image] } : {}),
    ...(summary ? { description: summary } : {}),
    ...(modified ? { dateModified: modified } : {}),
  };
  switch (type) {
    case 'article':
      return {
        ...base,
        '@type': 'ScholarlyArticle',
        author: authors,
        publisher,
        ...(date ? { datePublished: date } : {}),
        ...(category ? { articleSection: category } : {}),
        ...(issue ? { isPartOf: { '@type': 'PublicationIssue', name: issue.name, url: issue.url } } : {}),
        ...(pdf ? { encoding: { '@type': 'MediaObject', contentUrl: pdf, encodingFormat: 'application/pdf' } } : {}),
      };
    case 'news':
      return { ...base, '@type': 'NewsArticle', publisher, author: authors.length ? authors : publisher, ...(date ? { datePublished: date } : {}) };
    case 'book':
      return {
        ...base,
        '@type': 'Book',
        author: authors,
        publisher: doc.publisher ? { '@type': 'Organization', name: String(doc.publisher) } : publisher,
        ...(doc.year ? { datePublished: String(doc.year) } : {}),
        ...(doc.isbn ? { isbn: doc.isbn } : {}),
        ...(doc.pages ? { numberOfPages: Number(doc.pages) } : {}),
        ...(doc.edition ? { bookEdition: String(doc.edition) } : {}),
        ...(doc.translator ? { translator: { '@type': 'Person', name: String(doc.translator) } } : {}),
        ...(doc.editor ? { editor: { '@type': 'Person', name: String(doc.editor) } } : {}),
        ...(category ? { genre: category } : {}),
        ...(rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.value, ratingCount: rating.count, bestRating: 5, worstRating: 1 } } : {}),
        ...(pdf ? { workExample: { '@type': 'Book', bookFormat: 'https://schema.org/EBook', encodingFormat: 'application/pdf', url: pdf, isAccessibleForFree: true } } : {}),
      };
    case 'magazine':
      return {
        ...base,
        '@type': 'PublicationIssue',
        issueNumber: doc.issueNumber,
        publisher,
        ...(date ? { datePublished: date } : {}),
        isPartOf: { '@type': 'Periodical', name: PERIODICAL_NAME, publisher },
        ...(pdf ? { encoding: { '@type': 'MediaObject', contentUrl: pdf, encodingFormat: 'application/pdf' } } : {}),
      };
    case 'event':
    case 'forum': {
      const attendance = doc.venue ? 'https://schema.org/OfflineEventAttendanceMode' : doc.link ? 'https://schema.org/OnlineEventAttendanceMode' : undefined;
      // Google requires a startDate for Event markup. Many migrated events carry no structured date (their date is only in the text),
      // and a page about a past forum is not the event itself, so those are described as a plain CreativeWork instead of invalid Event markup.
      if (!doc.eventDate) return { ...base, '@type': 'CreativeWork', publisher };
      return {
        ...base,
        '@type': 'Event',
        organizer: publisher,
        startDate: String(doc.eventDate).slice(0, 10),
        ...(doc.endDate ? { endDate: String(doc.endDate).slice(0, 10) } : {}),
        ...(doc.venue ? { location: { '@type': 'Place', name: doc.venue, address: doc.venue } } : {}),
        ...(doc.speaker ? { performer: { '@type': 'Person', name: String(doc.speaker) } } : {}),
        ...(attendance ? { eventAttendanceMode: attendance } : {}),
      };
    }
    case 'video':
      return {
        ...base,
        '@type': 'VideoObject',
        description: summary || doc.title,
        thumbnailUrl: image ?? undefined,
        publisher,
        ...(doc.youtubeId ? { embedUrl: `https://www.youtube-nocookie.com/embed/${doc.youtubeId}` } : {}),
        ...(date ? { uploadDate: date } : {}),
      };
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export function orgJsonLd(o: OrgRef & { alternateName?: string; email?: string; address?: string; sameAs: string[]; description?: string }): Record<string, unknown> {
  return {
    '@type': 'ResearchOrganization',
    '@id': orgId(o),
    name: o.name,
    ...(o.alternateName ? { alternateName: o.alternateName } : {}),
    url: o.origin,
    logo: { '@type': 'ImageObject', url: o.logo },
    ...(o.description ? { description: o.description } : {}),
    ...(o.email ? { email: o.email } : {}),
    ...(o.address ? { address: { '@type': 'PostalAddress', streetAddress: o.address, addressCountry: 'YE' } } : {}),
    sameAs: o.sameAs,
  };
}

/** Organization + WebSite (with the sitelinks search box action) for the home page of a language. */
export function siteJsonLd(o: OrgRef & { alternateName?: string; email?: string; address?: string; sameAs: string[]; description?: string; lang: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      orgJsonLd(o),
      {
        '@type': 'WebSite',
        '@id': `${o.origin}/#website-${o.lang}`,
        url: `${o.origin}/${o.lang}`,
        name: o.name,
        inLanguage: o.lang,
        publisher: { '@id': orgId(o) },
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${o.origin}/${o.lang}/search?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
      },
    ],
  };
}

/** A listing page (section, topic, author works) as a CollectionPage with its visible items. */
export function collectionJsonLd(args: { name: string; description?: string; url: string; lang: string; org: OrgRef; items: { name: string; url: string }[]; total?: number }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${args.url}#collection`,
    url: args.url,
    name: args.name,
    inLanguage: args.lang,
    ...(args.description ? { description: args.description } : {}),
    isPartOf: { '@id': `${args.org.origin}/#website-${args.lang}` },
    publisher: { '@id': orgId(args.org) },
    mainEntity: {
      '@type': 'ItemList',
      ...(args.total ? { numberOfItems: args.total } : {}),
      itemListElement: args.items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: it.url, name: it.name })),
    },
  };
}

/** Author page: ProfilePage whose main entity is the Person (only the name is known unless a biography exists). */
export function personJsonLd(args: { name: string; url: string; lang: string; bio?: string | null; works: { name: string; url: string }[]; org: OrgRef }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: args.url,
    inLanguage: args.lang,
    mainEntity: {
      '@type': 'Person',
      '@id': `${args.url}#person`,
      name: args.name,
      url: args.url,
      ...(args.bio ? { description: args.bio } : {}),
      ...(args.works.length ? { subjectOf: args.works.slice(0, 20).map((w) => ({ '@type': 'CreativeWork', name: w.name, url: w.url })) } : {}),
    },
  };
}

/** Safe to embed inside <script type="application/ld+json">. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
