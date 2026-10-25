import Image from 'next/image';
import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { coverOf, docHref, displayDate } from '../lib/ctx.ts';
import type { Doc } from '../lib/data.ts';
import { formatMonthYear } from '../lib/dates.ts';
import { Icon } from './Icon.tsx';
import { EditorialCarousel } from './client/EditorialCarousel.tsx';

interface LatestIssuesSectionProps {
  ctx: Ctx;
  issues: Doc[];
}

export function LatestIssuesSection({ ctx, issues }: LatestIssuesSectionProps) {
  const { lang, href } = ctx;
  const isAr = lang.code === 'ar';

  if (!issues.length) return null;

  return (
    <section className="latest-issues-section" aria-labelledby="latest-issues-title">
      <div className="container">
        <EditorialCarousel
          id="latest-issues"
          isRtl={isAr}
          theme="light"
          badge={{
            label: isAr ? 'مجلة علمية محكّمة' : 'Peer-Reviewed Journal',
            icon: 'layers',
          }}
          title={isAr ? 'أحدث الأعداد' : 'Latest Issues'}
          description={
            isAr
              ? 'استكشف أحدث أعداد مجلة حضرموت الثقافية المحكمة بما تتضمنه من أبحاث ودراسات وقراءات تاريخية وتوثيقية رصينة.'
              : 'Explore the latest magazine issues featuring diverse studies, research, and articles.'
          }
          viewAll={{
            href: href('/magazines'),
            label: isAr ? 'جميع الأعداد' : 'All Issues',
          }}
          prevLabel={isAr ? 'عرض الأعداد السابقة' : 'Previous issues'}
          nextLabel={isAr ? 'عرض الأعداد التالية' : 'Next issues'}
        >
          {issues.map((doc, idx) => {
            const cover = coverOf(doc);
            const n = doc.issueNumber ? String(doc.issueNumber) : '';
            const issueHref = docHref(ctx, 'magazine', doc.id);
            const dateStr =
              doc.publishedAt && doc.datePrecision !== 'year'
                ? formatMonthYear(doc.publishedAt, lang.code)
                : displayDate(doc, lang.code) || (doc.season as string | undefined) || '';

            return (
              <article key={doc.id} className="issue-card-v2">
                <div className="issue-card-v2__cover-area">
                  {n ? (
                    <div className="issue-card-v2__badge">
                      <span>{isAr ? `العدد ${n}` : `Issue ${n}`}</span>
                    </div>
                  ) : null}

                  <div className="issue-card-v2__spine" aria-hidden="true" />

                  <Link
                    href={issueHref}
                    className="issue-card-v2__cover-link"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {cover ? (
                      <Image
                        src={cover.src}
                        alt={cover.alt || doc.title}
                        fill
                        sizes="(max-width: 640px) 75vw, (max-width: 1024px) 33vw, 290px"
                        priority={idx < 2}
                        loading={idx < 2 ? undefined : 'lazy'}
                        className="issue-card-v2__img"
                      />
                    ) : (
                      <div className="issue-card-v2__placeholder">
                        <Icon name="layers" className="issue-card-v2__placeholder-icon" />
                        <span className="issue-card-v2__placeholder-text">{doc.title}</span>
                      </div>
                    )}
                  </Link>
                </div>

                <div className="issue-card-v2__content">
                  <div className="issue-card-v2__meta">
                    {dateStr ? (
                      <span className="issue-card-v2__date">
                        <Icon name="calendar" className="issue-card-v2__meta-icon" />
                        <time dateTime={doc.publishedAt ?? undefined}>{dateStr}</time>
                      </span>
                    ) : null}
                    <span className="issue-card-v2__tag">
                      {isAr ? 'فصلية محكّمة' : 'Quarterly'}
                    </span>
                  </div>

                  <h3 className="issue-card-v2__title">
                    <Link href={issueHref} title={doc.title}>
                      {isAr
                        ? `مجلة حضرموت الثقافية ${n ? `— العدد ${n}` : ''}`
                        : `Hadhramout Cultural Magazine ${n ? `— Issue ${n}` : ''}`}
                    </Link>
                  </h3>

                  <div className="issue-card-v2__action">
                    <Link href={issueHref} className="issue-card-v2__btn">
                      <span>{isAr ? 'تصفح دراسات العدد' : 'Explore Issue'}</span>
                      <Icon name="arrow" className="issue-card-v2__arrow" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </EditorialCarousel>
      </div>
    </section>
  );
}
