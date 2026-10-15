import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, authorsOf, coverOf, displayDate, docHref, isLocale, makeCtx } from '../../../../../lib/ctx.ts';
import { typeFromRoute, type ContentType } from '../../../../../lib/content-types.ts';
import { getDoc, getSite, listDocs, trInfo, type Doc } from '../../../../../lib/data.ts';
import { buildMetadata } from '../../../../../lib/seo.ts';
import { appConfig } from '../../../../../lib/runtime-light.ts';
import { withHeadingIds } from '../../../../../lib/html-utils.ts';
import { localizeLegacyMedia } from '../../../../../lib/legacy-media.ts';
import { formatHijri } from '../../../../../lib/dates.ts';
import { readingMinutes } from '../../../../../lib/arabic.ts';
import { htmlToText } from '../../../../../lib/sanitize.ts';
import { bibKey, formatCitation, scholarMeta, toBibtex, toCslJson, toRis, type CiteSource } from '../../../../../lib/citations.ts';
import { breadcrumbJsonLd, contentJsonLd, jsonLdString } from '../../../../../lib/jsonld.ts';
import { Cover, textAttrs } from '../../../../../components/Cards.tsx';
import { Icon } from '../../../../../components/Icon.tsx';
import { CitePanel } from '../../../../../components/client/CitePanel.tsx';
import { PrintButton, ReadingTools, SaveButton, ShareMenu } from '../../../../../components/client/Tools.tsx';
import { TrBanner } from '../../../../../components/client/TrBanner.tsx';
import { VideoFacade } from '../../../../../components/client/VideoFacade.tsx';

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
    containerTitle: type === 'article' && magazine ? magazine.title : type === 'magazine' ? undefined : undefined,
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
  return buildMetadata({
    ctx,
    path: `/${section}/${id}`,
    title: doc.title,
    description: doc.excerpt ?? htmlToText(doc.body ?? '').slice(0, 200),
    image: cover ? (cover.remote ? cover.src : absolute(cover.src)) : null,
    type: info.type === 'book' ? 'book' : info.type === 'article' || info.type === 'news' ? 'article' : 'website',
    readyLangs: readyLangsOf(doc),
    incomplete: tr.status !== 'source' && tr.status !== 'complete',
    publishedTime: doc.datePrecision === 'day' ? doc.publishedAt : null,
    extra: info.type === 'article' || info.type === 'book' || info.type === 'magazine' ? (meta as never) : undefined,
  });
}

function Meta({ items }: { items: [string, string | null | undefined][] }) {
  const shown = items.filter(([, v]) => v);
  if (!shown.length) return null;
  return (
    <dl className="dl">
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
  const source = citeSourceOf(type, doc, url, locale, t('book.noYear'));
  const styles = {
    apa: formatCitation(source, 'apa'),
    mla: formatCitation(source, 'mla'),
    chicago: formatCitation(source, 'chicago'),
    harvard: formatCitation(source, 'harvard'),
  };
  const key = bibKey(source);
  const files = [
    { name: `${key}.bib`, mime: 'application/x-bibtex', content: toBibtex(source), label: 'BibTeX' },
    { name: `${key}.ris`, mime: 'application/x-research-info-systems', content: toRis(source), label: 'RIS (Zotero / EndNote)' },
    { name: `${key}.json`, mime: 'application/json', content: toCslJson(source), label: 'CSL-JSON' },
  ];
  const canCite = type === 'article' || type === 'book' || type === 'magazine' || type === 'news';
  const needsTranslation = locale !== 'ar' && tr.status !== 'complete';

  const [moreByAuthor, issueArticles] = await Promise.all([
    authors[0] && (type === 'article' || type === 'book') ? listDocs({ type, lang: locale, authorId: authors[0].id, limit: 5 }) : Promise.resolve(null),
    type === 'magazine' ? listDocs({ type: 'article', lang: locale, magazineId: doc.id, limit: 100, sort: 'oldest' }) : Promise.resolve(null),
  ]);
  const related = type === 'article' && magazine ? await listDocs({ type: 'article', lang: locale, magazineId: magazine.id, limit: 5 }) : null;

  const crumbs = [
    { name: t('nav.home'), url: absolute(`/${locale}`) },
    { name: t(TITLE_KEY[type]), url: absolute(`/${locale}/${section}`) },
    { name: doc.title, url },
  ];
  const jsonLd = [
    contentJsonLd({ type, doc, url, lang: ctx.lang.tag, image: cover ? (cover.remote ? cover.src : absolute(cover.src)) : null, orgName: site.name, orgUrl: absolute(`/${locale}`) }),
    breadcrumbJsonLd(crumbs),
  ];

  const eventDate = (doc.eventDate as string | undefined) ?? doc.publishedAt ?? undefined;
  const pdf = typeof doc.pdf === 'string' && doc.pdf ? doc.pdf : null;
  const waNumber = site.whatsapp?.[0]?.number?.replace(/^0+/, '').replace(/\D/g, '');

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
      <div className="container">
        <nav className="breadcrumbs" aria-label={t('a11y.breadcrumb')} style={{ paddingBlockStart: 'var(--space-5)' }}>
          <ol>
            <li><Link href={href('/')}>{t('nav.home')}</Link></li>
            <li><Link href={href(`/${section}`)}>{t(TITLE_KEY[type])}</Link></li>
          </ol>
        </nav>

        <div className={`article-layout ${type === 'book' ? 'article-layout--wide' : ''}`}>
          <article>
            {type === 'book' || type === 'magazine' ? (
              <div className="book-hero">
                <div className="book-hero__cover"><Cover doc={doc} sizes="256px" priority /></div>
                <div className="article-header">
                  {type === 'magazine' ? <p className="eyebrow">{t('meta.issue', { n: Number(doc.issueNumber ?? 0) })}</p> : null}
                  <h1 {...textAttrs(tr.titleLang, locale)}>{doc.title}</h1>
                  <Meta items={[
                    [t('meta.authors'), authors.map((a) => a.name).join('، ')],
                    [t('meta.editor'), doc.editor as string | undefined],
                    [t('meta.translator'), doc.translator as string | undefined],
                    [t('meta.publisher'), doc.publisher as string | undefined],
                    [t('meta.edition'), doc.edition as string | undefined],
                    [t('meta.year'), doc.year ? String(doc.year) : type === 'book' ? t('book.noYear') : date],
                    [t('meta.category'), category?.name],
                  ]} />
                  <div className="tools">
                    {pdf ? <a className="btn btn--primary" href={pdf} target="_blank" rel="noopener noreferrer"><Icon name="download" /> {t(type === 'book' ? 'book.download' : 'magazine.download')}</a> : null}
                    {type === 'book' ? <Link className="btn btn--gold" href={`${href('/contact')}?kind=book_request&book=${doc.id}&subject=${encodeURIComponent(t('contact.form.bookRequest', { title: doc.title }))}`}>{t('book.request')}</Link> : null}
                  </div>
                </div>
              </div>
            ) : (
              <header className="article-header">
                {category ? <p className="eyebrow">{category.name}</p> : null}
                {type === 'event' || type === 'forum' ? eventDate ? <p className="eyebrow">{displayDate({ publishedAt: eventDate, datePrecision: 'day' }, locale)}</p> : null : null}
                <h1 {...textAttrs(tr.titleLang, locale)}>{doc.title}</h1>
                <div className="article-meta">
                  {authors.length ? <span>{t('meta.by')} {authors.map((a, i) => <span key={a.id}>{i ? '، ' : ''}<Link href={href(`/authors/${a.id}`)}>{a.name}</Link></span>)}</span> : null}
                  {date ? <time dateTime={doc.publishedAt ?? undefined}>{date}{locale === 'ar' && doc.datePrecision === 'day' ? ` · ${t('meta.hijri')} ${formatHijri(doc.publishedAt)}` : ''}</time> : null}
                  {magazine ? <span>{t('meta.publishedIn')} <Link href={docHref(ctx, 'magazine', magazine.id)}>{magazine.title}</Link></span> : null}
                  {minutes ? <span>{t('meta.readingTime', { count: minutes })}</span> : null}
                  {doc.dateline ? <span>{String(doc.dateline)}</span> : null}
                </div>
              </header>
            )}

            <div className="tools no-print">
              {canCite ? (
                <CitePanel label={t('tools.cite')} title={t('cite.title')} note={t('cite.note')} copyLabel={t('tools.copy')} copiedLabel={t('tools.copied')} exportLabel={t('cite.export')} closeLabel={t('nav.close')} styles={styles} files={files} />
              ) : null}
              <ShareMenu label={t('tools.share')} title={doc.title} url={url} copyLink={t('tools.copyLink')} copied={t('tools.copied')} closeLabel={t('nav.close')} targets={{ whatsapp: t('share.whatsapp'), telegram: t('share.telegram'), x: t('share.x'), facebook: t('share.facebook') }} />
              {canCite ? <SaveButton id={`${type}:${doc.id}`} title={doc.title} url={href(`/${section}/${id}`)} type={type} labels={{ save: t('tools.save'), saved: t('tools.saved') }} /> : null}
              <PrintButton label={t('tools.print')} />
              <ReadingTools smaller={t('tools.textSmaller')} larger={t('tools.textLarger')} />
            </div>

            {type === 'event' || type === 'forum' ? (
              <Meta items={[
                [t('meta.speaker'), doc.speaker as string | undefined],
                [t('meta.moderator'), doc.moderator as string | undefined],
                [t('meta.time'), doc.timeText as string | undefined],
                [t('meta.venue'), doc.venue as string | undefined],
              ]} />
            ) : null}

            {type === 'video' && doc.youtubeId ? (
              <div style={{ marginBlock: 'var(--space-5)' }}>
                <VideoFacade youtubeId={String(doc.youtubeId)} title={doc.title} label={t('video.play')} poster={`https://i.ytimg.com/vi/${doc.youtubeId}/hqdefault.jpg`} />
                <p style={{ marginBlockStart: '0.6rem' }}><a href={`https://www.youtube.com/watch?v=${doc.youtubeId}`} target="_blank" rel="noopener noreferrer">{t('video.watchYoutube')} <Icon name="external" /></a></p>
              </div>
            ) : null}

            {type === 'news' && cover ? (
              <div className="card__media" style={{ aspectRatio: '16 / 9', borderRadius: 'var(--r-lg)', marginBlockEnd: 'var(--space-5)' }}>
                <Cover doc={doc} sizes="(max-width: 1000px) 100vw, 760px" priority />
              </div>
            ) : null}

            {prose ? (
              <div className="prose" lang={tr.bodyLang === 'ar' ? 'ar' : locale} dir={tr.bodyLang === 'ar' ? 'rtl' : ctx.lang.dir} dangerouslySetInnerHTML={{ __html: prose }} />
            ) : null}

            {issueArticles?.docs.length ? (
              <section style={{ marginBlockStart: 'var(--space-8)' }}>
                <h2 style={{ fontSize: 'var(--step-2)', marginBlockEnd: '1rem' }}>{t('article.issueArticles')}</h2>
                <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
                  {issueArticles.docs.map((a) => (
                    <li key={a.id}><Link href={docHref(ctx, 'article', a.id)}>{a.title}</Link>{authorsOf(a).length ? <span style={{ color: 'var(--muted)' }}> — {authorsOf(a).map((x) => x.name).join('، ')}</span> : null}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>

          <aside className="side no-print" aria-label={t('article.related')}>
            {toc.length > 2 ? (
              <nav className="side__box" aria-labelledby="toc-h">
                <h2 id="toc-h">{t('article.contents')}</h2>
                <ol className="toc">{toc.slice(0, 14).map((i) => <li key={i.id} style={{ paddingInlineStart: i.level === 3 ? '1rem' : 0 }}><a href={`#${i.id}`}>{i.text}</a></li>)}</ol>
              </nav>
            ) : null}
            {moreByAuthor && moreByAuthor.docs.filter((d) => d.id !== doc.id).length ? (
              <div className="side__box">
                <h2>{t('article.moreByAuthor', { name: authors[0]?.name ?? '' })}</h2>
                <ul className="toc">{moreByAuthor.docs.filter((d) => d.id !== doc.id).slice(0, 4).map((d) => <li key={d.id}><Link href={docHref(ctx, type, d.id)}>{d.title}</Link></li>)}</ul>
              </div>
            ) : null}
            {related && related.docs.filter((d) => d.id !== doc.id).length ? (
              <div className="side__box">
                <h2>{t('article.issueArticles')}</h2>
                <ul className="toc">{related.docs.filter((d) => d.id !== doc.id).slice(0, 4).map((d) => <li key={d.id}><Link href={docHref(ctx, 'article', d.id)}>{d.title}</Link></li>)}</ul>
              </div>
            ) : null}
            {waNumber && (type === 'book') ? (
              <a className="btn btn--secondary" href={`https://wa.me/${waNumber}?text=${encodeURIComponent(t('contact.form.bookRequest', { title: doc.title }))}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            ) : null}
          </aside>
        </div>
      </div>
      {jsonLd.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(j) }} />)}
    </>
  );
}

