import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Ctx } from '../lib/ctx.ts';
import { authorsOf, coverOf, displayDate, docHref } from '../lib/ctx.ts';
import { dayOf, monthShort } from '../lib/dates.ts';
import type { ContentType } from '../lib/content-types.ts';
import type { Doc } from '../lib/data.ts';
import { trInfo } from '../lib/data.ts';

/** `lang`/`dir` attributes for text that fell back to Arabic inside a page in another language. */
export function textAttrs(shownLang: string, pageLang: string): { lang?: string; dir?: 'rtl' } {
  return shownLang !== pageLang && shownLang === 'ar' ? { lang: 'ar', dir: 'rtl' } : {};
}

export function Cover({ doc, sizes, priority = false, fallbackLabel }: { doc: Doc; sizes: string; priority?: boolean; fallbackLabel?: string }) {
  const c = coverOf(doc);
  if (!c) return <div className="placeholder-cover" aria-hidden="true">{fallbackLabel ?? doc.title}</div>;
  return <Image src={c.src} alt={c.alt} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} />;
}

interface CardProps {
  ctx: Ctx;
  doc: Doc;
  type: ContentType;
  eager?: boolean;
  badge?: ReactNode;
}

export function Card({ ctx, doc, type, eager = false, badge }: CardProps) {
  const { t, lang } = ctx;
  const tr = trInfo(doc, lang.code);
  const date = displayDate(doc, lang.code);
  const authors = authorsOf(doc);
  const hasCover = Boolean(coverOf(doc));
  const isBook = type === 'book' || type === 'magazine';
  return (
    <article className={`card ${isBook ? 'card--book' : ''} ${!hasCover && type !== 'book' && type !== 'magazine' ? 'card--plain' : ''}`}>
      {hasCover || isBook ? (
        <div className="card__media">
          <Cover doc={doc} sizes="(max-width: 640px) 50vw, 280px" priority={eager} fallbackLabel={doc.title} />
        </div>
      ) : null}
      <div className="card__body">
        {badge}
        <h3 className="card__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={docHref(ctx, type, doc.id)}>{doc.title}</Link>
        </h3>
        {!isBook && doc.excerpt ? <p className="card__excerpt" {...textAttrs(tr.excerptLang, lang.code)}>{doc.excerpt}</p> : null}
        <div className="card__meta">
          {authors.length ? <span>{authors.map((a) => a.name).join('، ')}</span> : null}
          {date ? <time dateTime={doc.publishedAt ?? undefined}>{date}</time> : null}
          {type === 'magazine' && doc.issueNumber ? <span>{t('meta.issue', { n: Number(doc.issueNumber) })}</span> : null}
        </div>
      </div>
    </article>
  );
}

export function EventCard({ ctx, doc, type }: { ctx: Ctx; doc: Doc; type: 'event' | 'forum' }) {
  const { t, lang } = ctx;
  const tr = trInfo(doc, lang.code);
  const d = (doc.eventDate as string | undefined) ?? doc.publishedAt ?? undefined;
  const speaker = doc.speaker as string | undefined;
  return (
    <article className="card" style={{ flexDirection: 'row', gap: '1rem', padding: '1rem', alignItems: 'flex-start' }}>
      {d ? (
        <div className="date-badge" aria-hidden="true">
          <strong>{dayOf(d)}</strong>
          <span>{monthShort(d, lang.code)}</span>
        </div>
      ) : null}
      <div style={{ display: 'grid', gap: '0.35rem', minInlineSize: 0 }}>
        <h3 className="card__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={docHref(ctx, type, doc.id)}>{doc.title}</Link>
        </h3>
        {speaker ? <p className="card__meta"><span>{t('meta.speaker')}: {speaker}</span></p> : null}
      </div>
    </article>
  );
}

export function SectionHead({ title, href, more }: { title: string; href?: string; more?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {href && more ? (
        <Link className="btn btn--ghost btn--sm" href={href}>
          {more}
        </Link>
      ) : null}
    </div>
  );
}
