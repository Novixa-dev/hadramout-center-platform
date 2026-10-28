import Image from 'next/image';
import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { authorsOf, coverOf, docHref, displayDate } from '../lib/ctx.ts';
import type { Doc } from '../lib/data.ts';
import { Icon } from './Icon.tsx';
import { EditorialCarousel } from './client/EditorialCarousel.tsx';

interface PublicationsSectionProps {
  ctx: Ctx;
  books: Doc[];
}

export function PublicationsSection({ ctx, books }: PublicationsSectionProps) {
  const { lang, href } = ctx;
  const isAr = lang.code === 'ar';

  if (!books.length) return null;

  return (
    <section className="publications-section" aria-labelledby="center-publications-title" data-aos="fade-up">
      <div className="container">
        <EditorialCarousel
          id="center-publications"
          isRtl={isAr}
          theme="dark"
          badge={{
            label: isAr ? 'إصدارات ومطبوعات' : 'Center Publications',
            icon: 'book',
          }}
          title={isAr ? 'إصدارات المركز' : 'Center Publications'}
          description={
            isAr
              ? 'مختارات من أحدث الكتب والدراسات والأعمال التوثيقية الصادرة عن مركز حضرموت للدراسات التاريخية والتوثيق والنشر.'
              : 'Explore selected books and special publications highlighting important issues related to Hadramout and Yemen.'
          }
          viewAll={{
            href: href('/books'),
            label: isAr ? 'عرض جميع الإصدارات' : 'View All',
          }}
          prevLabel={isAr ? 'عرض الإصدارات السابقة' : 'Previous publications'}
          nextLabel={isAr ? 'عرض الإصدارات التالية' : 'Next publications'}
        >
          {books.map((doc, idx) => {
            const cover = coverOf(doc);
            const authors = authorsOf(doc);
            const authorNames = authors.map((a) => a.name).join('، ');
            const bookHref = docHref(ctx, 'book', doc.id);
            const hasPdf = Boolean(typeof doc.pdf === 'string' && doc.pdf);
            const yearStr = doc.year
              ? String(doc.year)
              : displayDate(doc, lang.code) || (isAr ? 'تاريخ غير محدد' : 'Unknown date');

            return (
              <article key={doc.id} className="pub-card-v2">
                <div className="pub-card-v2__cover-area">
                  {hasPdf ? (
                    <span className="pub-card-v2__pdf-badge" title="نسخة إلكترونية PDF متاحة">
                      <Icon name="file" className="pub-card-v2__pdf-icon" />
                      <span>PDF</span>
                    </span>
                  ) : null}

                  <div className="pub-card-v2__spine" aria-hidden="true" />

                  <Link
                    href={bookHref}
                    className="pub-card-v2__cover-link"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {cover ? (
                      <Image
                        src={cover.src}
                        alt={cover.alt || doc.title}
                        fill
                        sizes="(max-width: 640px) 75vw, (max-width: 1024px) 33vw, 280px"
                        priority={idx < 2}
                        loading={idx < 2 ? undefined : 'lazy'}
                        className="pub-card-v2__img"
                      />
                    ) : (
                      <div className="pub-card-v2__placeholder">
                        <Icon name="book" className="pub-card-v2__placeholder-icon" />
                        <span className="pub-card-v2__placeholder-text">{doc.title}</span>
                      </div>
                    )}
                  </Link>
                </div>

                <div className="pub-card-v2__content">
                  <div className="pub-card-v2__meta-top">
                    <span className="pub-card-v2__year">
                      <Icon name="calendar" className="pub-card-v2__meta-icon" />
                      <span>{yearStr}</span>
                    </span>
                    <span className="pub-card-v2__category-tag">
                      {isAr ? 'إصدار علمي' : 'Publication'}
                    </span>
                  </div>

                  <h3 className="pub-card-v2__title">
                    <Link href={bookHref} title={doc.title}>
                      {doc.title}
                    </Link>
                  </h3>

                  <div className="pub-card-v2__author-wrapper">
                    {authorNames ? (
                      <p className="pub-card-v2__author">
                        <Icon name="user" className="pub-card-v2__author-icon" />
                        <span dir="auto">{authorNames}</span>
                      </p>
                    ) : (
                      <p className="pub-card-v2__author pub-card-v2__author--org">
                        <Icon name="rosette" className="pub-card-v2__author-icon" />
                        <span>{isAr ? 'مركز حضرموت للدراسات' : 'Hadhramout Center'}</span>
                      </p>
                    )}
                  </div>

                  <div className="pub-card-v2__footer">
                    <Link href={bookHref} className="pub-card-v2__btn">
                      <span>{isAr ? 'تفاصيل الكتاب' : 'View Publication'}</span>
                      <Icon name="arrow" className="pub-card-v2__arrow" />
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
