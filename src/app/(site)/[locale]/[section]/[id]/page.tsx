import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, authorsOf, coverOf, displayDate, docHref, isLocale, makeCtx } from '../../../../../lib/ctx.ts';
import { typeFromRoute, type ContentType } from '../../../../../lib/content-types.ts';
import { getDoc, getDocsByIds, getSite, trInfo, type Doc } from '../../../../../lib/data.ts';
import { neighboursAndRelated, queryArchive } from '../../../../../lib/facets.ts';
import { buildMetadata } from '../../../../../lib/seo.ts';
import { describe } from '../../../../../lib/seo-text.ts';
import { appConfig } from '../../../../../lib/runtime-light.ts';
import { withHeadingIds } from '../../../../../lib/html-utils.ts';
import { localizeLegacyMedia } from '../../../../../lib/legacy-media.ts';
import { formatHijri } from '../../../../../lib/dates.ts';
import { readingMinutes } from '../../../../../lib/arabic.ts';
import { htmlToText } from '../../../../../lib/sanitize.ts';
import { bibKey, formatCitation, scholarMeta, toBibtex, toCslJson, toRis, type CiteSource } from '../../../../../lib/citations.ts';
import { breadcrumbJsonLd, contentJsonLd, jsonLdString } from '../../../../../lib/jsonld.ts';
import { MIN_REVIEWS_FOR_AGGREGATE, approvedReviews, type ReviewSummary } from '../../../../../lib/reviews.ts';
import { BookCard, Cover, EntryList, EventRow, SectionHead, Tile, VideoTile, textAttrs } from '../../../../../components/Cards.tsx';
import { Breadcrumbs } from '../../../../../components/PageHead.tsx';
import { Icon } from '../../../../../components/Icon.tsx';
import { Reviews } from '../../../../../components/Reviews.tsx';
import { CitePanel } from '../../../../../components/client/CitePanel.tsx';
import { CopyField, PrintButton, SaveButton, ShareMenu } from '../../../../../components/client/Tools.tsx';
import { ReaderSettings } from '../../../../../components/client/ReaderSettings.tsx';
import { ReadingProgress } from '../../../../../components/client/ReadingProgress.tsx';
import { CopyAttribution } from '../../../../../components/client/CopyAttribution.tsx';
import { TocSpy } from '../../../../../components/client/Toc.tsx';
import { TrBanner } from '../../../../../components/client/TrBanner.tsx';
import { VideoFacade } from '../../../../../components/client/VideoFacade.tsx';
import { PERIODICAL_NAME } from '../../../../../lib/periodical.ts';

type Props = { params: Promise<{ locale: string; section: string; id: string }> };

const TITLE_KEY: Record<ContentType, string> = {
  news: 'news.title', article: 'articles.title', book: 'books.title', magazine: 'magazines.title', event: 'events.title', forum: 'forum.title', video: 'videos.title',
};

function readyLangsOf(doc: Doc): string[] {
  const langs = ['ar'];
  for (const [l, m] of Object.entries(doc.translationMeta ?? {})) if (m && (m as Record<string, unknown>).title && (!doc.body || (m as Record<string, unknown>).body)) langs.push(l);
  return langs;
}

function citeSourceOf(type: ContentType, doc: Doc, url: string, lang: string, noYear: string): CiteSource {
  const magazine = typeof doc.magazine === 'object' && doc.magazine ? doc.magazine : null;
  const isBook = type === 'book';
  return {
    kind: isBook ? 'book' : type === 'news' ? 'news' : type === 'magazine' ? 'magazine' : type === 'article' ? 'article' : 'web',
    title: doc.title,
    authors: authorsOf(doc).map((a) => a.name),
    year: isBook ? (doc.year as number | undefined) : doc.datePrecision === 'day' || doc.datePrecision === 'month' || doc.datePrecision === 'year' ? Number(doc.publishedAt?.slice(0, 4)) : undefined,
    date: doc.datePrecision === 'day' ? doc.publishedAt?.slice(0, 10) : undefined,
    publisher: isBook ? (doc.publisher as string | undefined) : undefined,
    edition: doc.edition as string | undefined,
    editors: doc.editor ? [String(doc.editor)] : undefined,
    translators: doc.translator ? [String(doc.translator)] : undefined,
    containerTitle: type === 'article' && magazine ? PERIODICAL_NAME : undefined,
    issue: type === 'article' && magazine ? magazine.issueNumber : type === 'magazine' ? (doc.issueNumber as number | undefined) : undefined,
    url,
    accessed: new Date().toISOString(),
    lang,
    isbn: doc.isbn as string | undefined,
    noYear,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, section, id } = await params;
  const info = typeFromRoute(section);
  if (!info || !isLocale(locale) || !/^\d+$/.test(id)) return {};
  const ctx = makeCtx(locale);
  const doc = await getDoc(info.type, Number(id), locale);
  if (!doc) return {};
  const tr = trInfo(doc, locale);
  const cover = coverOf(doc, 'large');
  const url = absolute(`/${locale}/${section}/${id}`);
  const meta = scholarMeta(citeSourceOf(info.type, doc, url, locale, ''), typeof doc.pdf === 'string' ? doc.pdf : null);
  const category = typeof doc.category === 'object' && doc.category ? doc.category.name : null;
  return buildMetadata({
    ctx,
    path: `/${section}/${id}`,
    title: doc.title,
    description: describe(doc.excerpt, htmlToText(doc.body ?? '')),
    card: { kind: section, id: doc.id, v: doc.updatedAt ? Date.parse(doc.updatedAt) : undefined },
    imageAlt: cover?.alt,
    type: info.type === 'book' ? 'book' : info.type === 'article' || info.type === 'news' ? 'article' : 'website',
    readyLangs: readyLangsOf(doc),
    incomplete: tr.status !== 'source' && tr.status !== 'complete',
    publishedTime: doc.datePrecision === 'day' ? doc.publishedAt : null,
    modifiedTime: doc.updatedAt,
    authors: authorsOf(doc).map((a) => ({ name: a.name, url: absolute(`/${locale}/authors/${a.id}`) })),
    section: category,
    isbn: typeof doc.isbn === 'string' ? doc.isbn : null,
    extra: info.type === 'article' || info.type === 'book' || info.type === 'magazine' ? (meta as never) : undefined,
  });
}

function Facts({ items }: { items: [string, string | null | undefined][] }) {
  const shown = items.filter(([, v]) => v);
  if (!shown.length) return null;
  return (
    <dl className="facts">
      {shown.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function DetailPage({ params }: Props) {
  const { locale, section, id } = await params;
  const info = typeFromRoute(section);
  if (!info || !isLocale(locale) || !/^\d+$/.test(id)) notFound();
  const type = info.type;
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const doc = await getDoc(type, Number(id), locale);
  if (!doc) notFound();

  const site = await getSite(locale);
  const cfg = appConfig();
  const tr = trInfo(doc, locale);
  const url = absolute(`/${locale}/${section}/${id}`);
  const cover = coverOf(doc, 'large');
  const authors = authorsOf(doc);
  const date = displayDate(doc, locale);
  const bodyHtml = doc.body ?? '';
  const { html: prose, toc } = withHeadingIds(localizeLegacyMedia(bodyHtml));
  const minutes = bodyHtml ? readingMinutes(htmlToText(bodyHtml), locale) : 0;
  const category = typeof doc.category === 'object' && doc.category ? doc.category : null;
  const magazine = typeof doc.magazine === 'object' && doc.magazine ? doc.magazine : null;
  const pdf = typeof doc.pdf === 'string' && doc.pdf ? doc.pdf : null;
  const isEvent = type === 'event' || type === 'forum';
  const eventDate = (doc.eventDate as string | undefined) ?? undefined;
  const source = citeSourceOf(type, doc, url, locale, t('book.noYear'));
  const styles = { apa: formatCitation(source, 'apa'), mla: formatCitation(source, 'mla'), chicago: formatCitation(source, 'chicago'), harvard: formatCitation(source, 'harvard') };
  const key = bibKey(source);
  const files = [
    { name: `${key}.bib`, mime: 'application/x-bibtex', content: toBibtex(source), label: 'BibTeX' },
    { name: `${key}.ris`, mime: 'application/x-research-info-systems', content: toRis(source), label: 'RIS (Zotero / EndNote)' },
    { name: `${key}.json`, mime: 'application/json', content: toCslJson(source), label: 'CSL-JSON' },
  ];
  const canCite = type === 'article' || type === 'book' || type === 'magazine' || type === 'news';
  const reviewable = (type === 'book' || type === 'article' || type === 'magazine') && site.reviewsEnabled !== false;
  const needsTranslation = locale !== 'ar' && tr.status !== 'complete';
  const showToc = type === 'article' && toc.length > 2;
  const reading = type === 'article' || type === 'news';

  // related content, neighbours and (for issues) the table of contents — all from real relationships
  const [nr, byAuthor, issueContents, reviews] = await Promise.all([
    neighboursAndRelated(type, doc.id),
    authors[0] && (type === 'article' || type === 'book') ? queryArchive({ type, lang: locale, author: authors[0].id, limit: 6 }) : Promise.resolve(null),
    type === 'magazine' ? queryArchive({ type: 'article', lang: locale, magazineId: doc.id, sort: 'oldest', limit: 200 }) : Promise.resolve(null),
    reviewable ? approvedReviews(type as 'book' | 'article' | 'magazine', doc.id) : Promise.resolve<ReviewSummary | null>(null),
  ]);
  const neighbourDocs = await getDocsByIds(info.slug, [nr.newer?.id, nr.older?.id, ...nr.related.map((r) => r.id)].filter((x): x is number => typeof x === 'number'), locale, { light: true });
  const byId = new Map(neighbourDocs.map((d) => [d.id, d]));
  const newer = nr.newer ? byId.get(nr.newer.id) : undefined;
  const older = nr.older ? byId.get(nr.older.id) : undefined;
  const related = nr.related.map((r) => byId.get(r.id)).filter((d): d is Doc => Boolean(d));
  const moreByAuthor = byAuthor?.docs.filter((d) => d.id !== doc.id).slice(0, 5) ?? [];

  const crumbs: { name: string; path?: string }[] = [{ name: t(TITLE_KEY[type]), path: `/${section}` }, ...(category && type === 'article' ? [{ name: category.name, path: `/topics/${category.id}` }] : []), { name: doc.title }];
  const jsonLd = [
    contentJsonLd({
      type,
      doc,
      url,
      lang: ctx.lang.tag,
      image: cover ? absolute(cover.src) : null,
      org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') },
      authorUrl: (aid) => absolute(`/${locale}/authors/${aid}`),
      pdf,
      issue: magazine ? { name: magazine.title, url: absolute(`/${locale}/magazines/${magazine.id}`) } : null,
      category: category?.name ?? null,
      rating: type === 'book' && reviews && reviews.count >= MIN_REVIEWS_FOR_AGGREGATE ? { value: reviews.average, count: reviews.count } : null,
    }),
    breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${locale}`) }, ...crumbs.map((c) => ({ name: c.name, url: c.path ? absolute(`/${locale}${c.path}`) : url }))]),
  ];

  const waNumber = site.whatsapp?.[0]?.number?.replace(/^0+/, '').replace(/\D/g, '');
  const hijri = locale === 'ar' && doc.datePrecision === 'day' && doc.publishedAt ? ` · ${t('meta.hijri')} ${formatHijri(doc.publishedAt)}` : '';
  const byline = (
    <div className="byline">
      {authors.length ? (
        <span><Icon name="user" />{authors.map((a, i) => <span key={a.id}>{i ? '، ' : ''}<Link href={href(`/authors/${a.id}`)}>{a.name}</Link></span>)}</span>
      ) : null}
      {date && !isEvent ? <span><Icon name="calendar" /><time dateTime={doc.publishedAt ?? undefined}>{date}{hijri}</time></span> : null}
      {magazine ? <span><Icon name="book" />{t('meta.publishedIn')} <Link href={docHref(ctx, 'magazine', magazine.id)}>{magazine.title}</Link></span> : null}
      {minutes ? <span><Icon name="clock" />{t('meta.readingTime', { count: minutes })}</span> : null}
      {doc.dateline ? <span><Icon name="pin" />{String(doc.dateline)}</span> : null}
    </div>
  );

  const actions = (
    <div className="actions no-print">
      {pdf ? (
        <>
          <a className="btn btn--primary" href={pdf} target="_blank" rel="noopener noreferrer"><Icon name="file" /> {t('pdf.read')}<span className="sr-only"> ({t('a11y.newWindow')})</span></a>
          <a className="btn btn--secondary" href={pdf} download><Icon name="download" /> {t(type === 'book' ? 'book.download' : 'magazine.download')}</a>
        </>
      ) : null}
      {type === 'book' ? <Link className="btn btn--gold" href={`${href('/contact')}?kind=book_request&book=${doc.id}&subject=${encodeURIComponent(t('contact.form.bookRequest', { title: doc.title }))}`}>{t('book.request')}</Link> : null}
      {isEvent && eventDate ? <a className="btn btn--primary" href={`/api/hc/ics/${section}/${doc.id}.ics?lang=${locale}`}><Icon name="calendar" /> {t('event.addToCalendar')}</a> : null}
      {pdf || type === 'book' || isEvent ? <span className="actions__sep" aria-hidden="true" /> : null}
      {canCite ? <CitePanel label={t('tools.cite')} title={t('cite.title')} note={t('cite.note')} copyLabel={t('tools.copy')} copiedLabel={t('tools.copied')} exportLabel={t('cite.export')} closeLabel={t('nav.close')} styles={styles} files={files} /> : null}
      <ShareMenu label={t('tools.share')} title={doc.title} url={url} copyLink={t('tools.copyLink')} copied={t('tools.copied')} closeLabel={t('nav.close')} targets={{ whatsapp: t('share.whatsapp'), telegram: t('share.telegram'), x: t('share.x'), facebook: t('share.facebook') }} />
      {canCite ? <SaveButton id={`${type}:${doc.id}`} title={doc.title} url={href(`/${section}/${id}`)} type={type} labels={{ save: t('tools.save'), saved: t('tools.saved') }} /> : null}
      <PrintButton label={t('tools.print')} />
      {reading ? (
        <ReaderSettings
          label={t('reader.title')}
          labels={{ title: t('reader.title'), size: t('reader.size'), spacing: t('reader.spacing'), width: t('reader.width'), reset: t('reader.reset'), sizes: [t('reader.size.sm'), t('reader.size.md'), t('reader.size.lg'), t('reader.size.xl')], lines: [t('reader.lh.tight'), t('reader.lh.normal'), t('reader.lh.loose')], widths: [t('reader.rw.narrow'), t('reader.rw.normal'), t('reader.rw.wide')] }}
        />
      ) : null}
    </div>
  );

  const header = (
    <header className="article-header" data-print-source={`${site.name} — ${url}`}>
      <p className="cluster" style={{ '--gap': '0.75rem' } as React.CSSProperties}>
        {category && type === 'article' ? (
          <Link className="kicker" href={href(`/topics/${category.id}`)}>{category.name}</Link>
        ) : (
          <>
            <Link className="kicker" href={href(`/${section}`)}>{t(TITLE_KEY[type])}</Link>
            {category ? <span className="kicker">{category.name}</span> : null}
          </>
        )}
        {type === 'magazine' ? <span className="kicker">{t('meta.issue', { n: Number(doc.issueNumber ?? 0) })}</span> : null}
      </p>
      <h1 className={`article-title ${doc.title.length > 90 ? 'article-title--sm' : ''}`} {...textAttrs(tr.titleLang, locale)}>{doc.title}</h1>
      {type === 'book' || type === 'magazine' ? null : byline}
    </header>
  );

  const pager =
    newer || older ? (
      <nav className="pager no-print" aria-label={t('pager.label')}>
        {older ? (
          <Link href={docHref(ctx, type, older.id)} rel="prev">
            <small>{type === 'magazine' ? t('pager.olderIssue') : t('pager.older')}</small>
            <strong>{type === 'magazine' ? t('meta.issue', { n: Number(older.issueNumber ?? 0) }) : older.title}</strong>
          </Link>
        ) : <span />}
        {newer ? (
          <Link href={docHref(ctx, type, newer.id)} rel="next" className="pager__next">
            <small>{type === 'magazine' ? t('pager.newerIssue') : t('pager.newer')}</small>
            <strong>{type === 'magazine' ? t('meta.issue', { n: Number(newer.issueNumber ?? 0) }) : newer.title}</strong>
          </Link>
        ) : <span />}
      </nav>
    ) : null;

  const citeBox = canCite ? (
    <section className="box box--tint no-print" aria-labelledby="cite-h" style={{ marginBlockStart: 'var(--space-8)' }}>
      <h2 id="cite-h">{t('cite.box.title')}</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 'var(--step--1)', marginBlockEnd: '0.6rem' }}>{t('cite.box.note')}</p>
      <CopyField value={url} label={t('tools.copyLink')} copied={t('tools.copied')} />
      <p style={{ marginBlockStart: '0.9rem', fontSize: 'var(--step--1)', lineHeight: 1.9 }} dir="auto">{styles.apa}</p>
    </section>
  ) : null;

  const relatedBlock = related.length ? (
    <section style={{ marginBlockStart: 'var(--space-8)' }} aria-labelledby="rel-h">
      <SectionHead title={t('article.related')} id="rel-h" as="h2" />
      {type === 'book' ? (
        <div className="results-grid results-grid--books">{related.map((d) => <BookCard key={d.id} ctx={ctx} doc={d} />)}</div>
      ) : type === 'news' ? (
        <div className="results-grid">{related.map((d) => <Tile key={d.id} ctx={ctx} doc={d} type="news" />)}</div>
      ) : isEvent ? (
        <div>{related.map((d) => <EventRow key={d.id} ctx={ctx} doc={d} type={type as 'event' | 'forum'} />)}</div>
      ) : type === 'video' ? (
        <div className="results-grid">{related.map((d) => <VideoTile key={d.id} ctx={ctx} doc={d} />)}</div>
      ) : (
        <EntryList ctx={ctx} docs={related} type={type} compact />
      )}
    </section>
  ) : null;

  const moreByAuthorBlock = moreByAuthor.length && authors[0] ? (
    <section style={{ marginBlockStart: 'var(--space-8)' }} aria-labelledby="more-author-h">
      <SectionHead title={t('article.moreByAuthor', { name: authors[0].name })} id="more-author-h" href={href(`/authors/${authors[0].id}`)} more={t('section.viewAll')} as="h2" />
      {type === 'book' ? <div className="results-grid results-grid--books">{moreByAuthor.map((d) => <BookCard key={d.id} ctx={ctx} doc={d} />)}</div> : <EntryList ctx={ctx} docs={moreByAuthor} type={type} compact />}
    </section>
  ) : null;

  const proseBlock = prose ? (
    <div id="article-body" className="prose" lang={tr.bodyLang === 'ar' ? 'ar' : locale} dir={tr.bodyLang === 'ar' ? 'rtl' : ctx.lang.dir} dangerouslySetInnerHTML={{ __html: prose }} />
  ) : null;

  return (
    <>
      {locale !== 'ar' ? (
        <TrBanner
          lang={locale}
          slug={info.slug}
          id={doc.id}
          needsTranslation={needsTranslation}
          machine={tr.machine}
          reviewed={tr.reviewed}
          providerEnabled={cfg.translation.provider !== 'none'}
          originalHref={href(`/${section}/${id}`, 'ar')}
          reportHref={`${href('/contact')}?kind=translation_issue&page=${encodeURIComponent(`/${locale}/${section}/${id}`)}`}
          labels={{ machine: t('tr.machine'), reviewed: t('tr.reviewed'), pending: t('tr.pending'), unavailable: t('tr.unavailable'), failed: t('tr.failed'), ready: t('tr.ready'), viewOriginal: t('tr.viewOriginal'), report: t('tr.report') }}
        />
      ) : null}
      {reading && prose ? <ReadingProgress targetId="article-body" /> : null}
      {prose ? <CopyAttribution targetId="article-body" line={`${t('copy.source', { title: doc.title, site: site.name })}\n${url}`} /> : null}
      <div className="container">
        <div style={{ paddingBlockStart: 'var(--space-5)' }}><Breadcrumbs ctx={ctx} items={crumbs} /></div>

        <div className={`article-layout ${showToc ? 'article-layout--toc' : ''}`}>
          {showToc ? (
            <aside className="toc-box no-print" aria-label={t('article.contents')}>
              <h2>{t('article.contents')}</h2>
              <ol className="toc" id="toc-list">
                {toc.slice(0, 24).map((i) => <li key={i.id} data-level={i.level}><a href={`#${i.id}`}>{i.text}</a></li>)}
              </ol>
              <TocSpy listId="toc-list" />
            </aside>
          ) : null}

          <article className="article-main">
            {type === 'book' || type === 'magazine' ? (
              <div className="book-hero">
                <div className="book-hero__cover"><Cover doc={doc} sizes="272px" priority /></div>
                <div>
                  {header}
                  <Facts items={[
                    [t('meta.authors'), authors.length ? authors.map((a) => a.name).join('، ') : null],
                    [t('meta.editor'), doc.editor as string | undefined],
                    [t('meta.translator'), doc.translator as string | undefined],
                    [t('meta.publisher'), doc.publisher as string | undefined],
                    [t('meta.edition'), doc.edition as string | undefined],
                    [t('meta.year'), doc.year ? String(doc.year) : type === 'book' ? t('book.noYear') : date],
                    [t('meta.pages'), doc.pages ? String(doc.pages) : null],
                    ['ISBN', doc.isbn as string | undefined],
                    [t('meta.season'), type === 'magazine' ? (doc.season as string | undefined) : null],
                    [t('meta.category'), category?.name],
                  ]} />
                  {actions}
                </div>
              </div>
            ) : (
              <>
                {isEvent ? (
                  <div className="event-hero">
                    {eventDate ? (
                      <div className="date-block" aria-hidden="true">
                        <strong>{eventDate.slice(8, 10).replace(/^0/, '')}</strong>
                        <span>{eventDate.slice(0, 4)}</span>
                      </div>
                    ) : null}
                    <div>
                      {header}
                      {eventDate ? <p className="byline"><span><Icon name="calendar" /><time dateTime={eventDate.slice(0, 10)}>{displayDate({ publishedAt: eventDate, datePrecision: 'day' }, locale)}</time></span></p> : null}
                    </div>
                  </div>
                ) : header}
                {actions}
              </>
            )}

            {isEvent ? <Facts items={[[t('meta.speaker'), doc.speaker as string | undefined], [t('meta.moderator'), doc.moderator as string | undefined], [t('meta.time'), doc.timeText as string | undefined], [t('meta.venue'), doc.venue as string | undefined]]} /> : null}

            {(type === 'video' || isEvent) && doc.youtubeId ? (
              <div style={{ marginBlock: 'var(--space-5)' }}>
                <VideoFacade youtubeId={String(doc.youtubeId)} title={doc.title} label={t('video.play')} poster={`https://i.ytimg.com/vi/${doc.youtubeId}/hqdefault.jpg`} />
                <p style={{ marginBlockStart: '0.6rem' }}><a href={`https://www.youtube.com/watch?v=${doc.youtubeId}`} target="_blank" rel="noopener noreferrer">{t('video.watchYoutube')} <Icon name="external" /></a></p>
              </div>
            ) : null}

            {type === 'news' && cover ? (
              <div className="tile__media" style={{ aspectRatio: '16 / 9', marginBlockEnd: 'var(--space-5)' }}>
                <Cover doc={doc} sizes="(max-width: 1000px) 100vw, 760px" priority />
              </div>
            ) : null}

            {showToc ? (
              <details className="toc-inline no-print">
                <summary>{t('article.contents')}</summary>
                <ol className="toc">{toc.slice(0, 24).map((i) => <li key={i.id} data-level={i.level}><a href={`#${i.id}`}>{i.text}</a></li>)}</ol>
              </details>
            ) : null}

            {proseBlock}

            {issueContents?.docs.length ? (
              <section style={{ marginBlockStart: 'var(--space-8)' }} aria-labelledby="issue-h">
                <SectionHead title={t('article.issueArticles')} id="issue-h" lead={t('magazine.contents.count', { count: issueContents.total })} />
                <EntryList ctx={ctx} docs={issueContents.docs} type="article" compact />
              </section>
            ) : null}

            {waNumber && type === 'book' ? (
              <p style={{ marginBlockStart: 'var(--space-5)' }}>
                <a className="btn btn--secondary" href={`https://wa.me/${waNumber}?text=${encodeURIComponent(t('contact.form.bookRequest', { title: doc.title }))}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </p>
            ) : null}

            {citeBox}
            {reviews ? <Reviews ctx={ctx} type={type as 'book' | 'article' | 'magazine'} id={doc.id} data={reviews} /> : null}
            {moreByAuthorBlock}
            {relatedBlock}
            {pager}
            {doc.updatedAt ? <p className="no-print" style={{ color: 'var(--muted)', fontSize: 'var(--step--2)', marginBlockStart: 'var(--space-6)' }}>{t('meta.updated')}: <time dateTime={doc.updatedAt}>{displayDate({ publishedAt: doc.updatedAt, datePrecision: 'day' }, locale)}</time></p> : null}
          </article>
        </div>
      </div>
      {jsonLd.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(j) }} />)}
    </>
  );
}
