import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Ctx } from '../lib/ctx.ts';
import { authorsOf, coverOf, displayDate, docHref } from '../lib/ctx.ts';
import { dayOf, monthShort } from '../lib/dates.ts';
import type { ContentType } from '../lib/content-types.ts';
import type { Doc } from '../lib/data.ts';
import { trInfo } from '../lib/data.ts';
import { Icon } from './Icon.tsx';

/** `lang`/`dir` attributes for text that fell back to Arabic inside a page in another language. */
export function textAttrs(shownLang: string, pageLang: string): { lang?: string; dir?: 'rtl' } {
  return shownLang !== pageLang && shownLang === 'ar' ? { lang: 'ar', dir: 'rtl' } : {};
}

export function Cover({ doc, sizes, priority = false, fallbackLabel, decorative = false }: { doc: Doc; sizes: string; priority?: boolean; fallbackLabel?: string; decorative?: boolean }) {
  const c = coverOf(doc);
  if (!c) return <div className="placeholder-cover" aria-hidden="true">{fallbackLabel ?? doc.title}</div>;
  // alt text identifies the work; on cards the title link already names it, so the image is decorative there
  return <Image src={c.src} alt={decorative ? '' : c.alt} fill sizes={sizes} priority={priority} loading={priority ? undefined : 'lazy'} style={{ objectFit: 'cover' }} />;
}

const categoryOf = (doc: Doc): { id: number; name: string } | null => (doc.category && typeof doc.category === 'object' ? doc.category : null);

interface CardProps {
  ctx: Ctx;
  doc: Doc;
  eager?: boolean;
}

function Kicker({ ctx, doc, type }: { ctx: Ctx; doc: Doc; type: ContentType }) {
  const cat = categoryOf(doc);
  if (cat) return <Link className="kicker" href={ctx.href(`/topics/${cat.id}`)} style={{ position: 'relative', zIndex: 1 }}>{cat.name}</Link>;
  return <span className="kicker">{ctx.t(`card.type.${type}`)}</span>;
}

/** Row used for articles/studies in lists, search, related and author pages. */
export function Entry({ ctx, doc, type = 'article', eager = false, compact = false }: CardProps & { type?: ContentType; compact?: boolean }) {
  const { lang, href } = ctx;
  const tr = trInfo(doc, lang.code);
  const date = displayDate(doc, lang.code);
  const authors = authorsOf(doc);
  const hasCover = Boolean(coverOf(doc)) && type !== 'article';
  const issue = typeof doc.magazine === 'object' && doc.magazine ? doc.magazine : null;
  return (
    <article className={`entry ${compact ? 'entry--compact' : ''}`}>
      <div className="entry__main">
        {compact ? null : <Kicker ctx={ctx} doc={doc} type={type} />}
        <h3 className="entry__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={docHref(ctx, type, doc.id)}>{doc.title}</Link>
        </h3>
        {!compact && doc.excerpt ? <p className="entry__excerpt" {...textAttrs(tr.excerptLang, lang.code)}>{doc.excerpt}</p> : null}
        <p className="entry__meta">
          {authors.length ? <span>{authors.map((a, i) => <span key={a.id}>{i ? '، ' : ''}<Link href={href(`/authors/${a.id}`)}>{a.name}</Link></span>)}</span> : null}
          {date ? <time dateTime={doc.publishedAt ?? undefined}>{date}</time> : null}
          {issue ? <span>{ctx.t('meta.issue', { n: Number(issue.issueNumber ?? 0) })}</span> : null}
        </p>
      </div>
      {hasCover ? (
        <div className="entry__thumb">
          <Cover doc={doc} sizes="120px" priority={eager} decorative />
        </div>
      ) : null}
    </article>
  );
}

export function EntryList({ ctx, docs, type = 'article', compact = false }: { ctx: Ctx; docs: Doc[]; type?: ContentType; compact?: boolean }) {
  return (
    <ul className="entry-list" role="list">
      {docs.map((d) => (
        <li key={d.id}>
          <Entry ctx={ctx} doc={d} type={type} compact={compact} />
        </li>
      ))}
    </ul>
  );
}

/** Image-led card: news and generic items. */
export function Tile({ ctx, doc, type = 'news', eager = false, lead = false, row = false }: CardProps & { type?: ContentType; lead?: boolean; row?: boolean }) {
  const { lang } = ctx;
  const tr = trInfo(doc, lang.code);
  const date = displayDate(doc, lang.code);
  const hasCover = Boolean(coverOf(doc));
  return (
    <article className={`tile ${lead ? 'tile--lead' : ''} ${row ? 'tile--row' : ''}`}>
      {hasCover ? (
        <div className="tile__media">
          <Cover doc={doc} sizes={lead ? '(max-width: 900px) 100vw, 680px' : row ? '180px' : '(max-width: 640px) 90vw, 300px'} priority={eager} decorative />
        </div>
      ) : null}
      <div className="tile__body">
        <Kicker ctx={ctx} doc={doc} type={type} />
        <h3 className="tile__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={docHref(ctx, type, doc.id)}>{doc.title}</Link>
        </h3>
        {!row && doc.excerpt ? <p className="tile__excerpt" {...textAttrs(tr.excerptLang, lang.code)}>{doc.excerpt}</p> : null}
        {date ? <p className="tile__meta"><time dateTime={doc.publishedAt ?? undefined}>{date}</time></p> : null}
      </div>
    </article>
  );
}

export function BookCard({ ctx, doc, eager = false }: CardProps) {
  const { lang, t } = ctx;
  const tr = trInfo(doc, lang.code);
  const authors = authorsOf(doc);
  const year = doc.year ? String(doc.year) : displayDate(doc, lang.code);
  const pdf = typeof doc.pdf === 'string' && doc.pdf;
  return (
    <article className="book">
      <div className="book__cover">
        <Cover doc={doc} sizes="(max-width: 640px) 44vw, 200px" priority={eager} fallbackLabel={doc.title} decorative />
        {pdf ? <span className="badge book__flag"><Icon name="file" />PDF</span> : null}
      </div>
      <div>
        <h3 className="book__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={docHref(ctx, 'book', doc.id)}>{doc.title}</Link>
        </h3>
        {authors.length ? <p className="book__author">{authors.map((a) => a.name).join('، ')}</p> : null}
        {year ? <p className="book__meta">{year}</p> : <p className="book__meta">{t('book.noYear')}</p>}
      </div>
    </article>
  );
}

export function IssueCard({ ctx, doc, eager = false }: CardProps) {
  const { lang, t } = ctx;
  const date = displayDate(doc, lang.code) || (doc.season as string | undefined) || '';
  const n = Number(doc.issueNumber ?? 0);
  return (
    <article className="issue">
      <div className="issue__cover">
        <Cover doc={doc} sizes="(max-width: 640px) 44vw, 220px" priority={eager} fallbackLabel={doc.title} decorative />
      </div>
      <div>
        <h3 className="issue__title">
          <Link href={docHref(ctx, 'magazine', doc.id)} aria-label={doc.title}>{t('meta.issue', { n })}</Link>
        </h3>
        {date ? <p className="book__meta">{date}</p> : null}
      </div>
    </article>
  );
}

export function EventRow({ ctx, doc, type }: { ctx: Ctx; doc: Doc; type: 'event' | 'forum' }) {
  const { t, lang } = ctx;
  const tr = trInfo(doc, lang.code);
  const d = (doc.eventDate as string | undefined) ?? doc.publishedAt ?? undefined;
  const today = new Date().toISOString().slice(0, 10);
  const past = d ? d.slice(0, 10) < today : true;
  const bits = [doc.speaker && `${t('meta.speaker')}: ${doc.speaker}`, doc.venue as string | undefined, doc.timeText as string | undefined].filter(Boolean) as string[];
  return (
    <article className="event">
      {d ? (
        <div className={`date-block ${past ? 'date-block--past' : ''}`} aria-hidden="true">
          <strong>{dayOf(d)}</strong>
          <span>{monthShort(d, lang.code)}</span>
        </div>
      ) : <span />}
      <div className="event__body">
        <h3 className="event__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={docHref(ctx, type, doc.id)}>{doc.title}</Link>
        </h3>
        {d ? <p className="event__meta"><time dateTime={d.slice(0, 10)}>{displayDate({ publishedAt: d, datePrecision: 'day' }, lang.code)}</time>{bits.map((b) => <span key={b}>{b}</span>)}</p> : bits.length ? <p className="event__meta">{bits.map((b) => <span key={b}>{b}</span>)}</p> : null}
      </div>
    </article>
  );
}

export function VideoTile({ ctx, doc }: { ctx: Ctx; doc: Doc }) {
  const { lang } = ctx;
  const tr = trInfo(doc, lang.code);
  const poster = doc.youtubeId ? `https://i.ytimg.com/vi/${doc.youtubeId}/hqdefault.jpg` : null;
  const c = coverOf(doc);
  const src = c?.src ?? poster;
  return (
    <article className="vtile">
      <div className="vtile__media">
        {src ? <Image src={src} alt="" fill sizes="(max-width: 640px) 90vw, 380px" style={{ objectFit: 'cover' }} loading="lazy" /> : null}
        <span className="vtile__play" aria-hidden="true"><span><Icon name="play" /></span></span>
      </div>
      <h3 className="vtile__title" {...textAttrs(tr.titleLang, lang.code)}>
        <Link href={docHref(ctx, 'video', doc.id)}>{doc.title}</Link>
      </h3>
    </article>
  );
}

/** Picks the right card for a content type (used by generic lists and search). */
export function ContentCard({ ctx, doc, type, eager = false }: CardProps & { type: ContentType }) {
  switch (type) {
    case 'book':
      return <BookCard ctx={ctx} doc={doc} eager={eager} />;
    case 'magazine':
      return <IssueCard ctx={ctx} doc={doc} eager={eager} />;
    case 'event':
    case 'forum':
      return <EventRow ctx={ctx} doc={doc} type={type} />;
    case 'video':
      return <VideoTile ctx={ctx} doc={doc} />;
    case 'news':
      return <Tile ctx={ctx} doc={doc} type="news" eager={eager} />;
    default:
      return <Entry ctx={ctx} doc={doc} type={type} eager={eager} />;
  }
}

export function SectionHead({ title, href, more, lead, id, as: Tag = 'h2' }: { title: string; href?: string; more?: string; lead?: ReactNode; id?: string; as?: 'h2' | 'h3' }) {
  return (
    <div className="section-head">
      <Tag id={id}>{title}</Tag>
      {href && more ? (
        <Link className="link-arrow" href={href}>
          {more} <Icon name="arrow" />
        </Link>
      ) : null}
      {lead ? <p>{lead}</p> : null}
    </div>
  );
}
