import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listApprovedTestimonials } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { PageHead } from '../../../../components/PageHead.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  const items = await listApprovedTestimonials(locale, 1);
  // an empty page is not worth indexing; it becomes indexable with the first published testimonial
  return buildMetadata({ ctx, path: '/testimonials', title: ctx.t('testimonials.title'), description: ctx.t('testimonials.lead'), card: { key: 'testimonials' }, noindex: items.length === 0 });
}

/** «قالوا عنا»: published testimonials whose authors agreed in writing to publication. */
export default async function TestimonialsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t } = ctx;
  const items = await listApprovedTestimonials(locale);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('testimonials.title') }]} title={t('testimonials.title')} lead={t('testimonials.lead')} />
      <div className="container container--narrow section">
        {items.length ? (
          <ul className="testimonial-list">
            {items.map((x) => (
              <li key={x.id}>
                <figure className="testimonial">
                  <blockquote><p>{x.quote}</p></blockquote>
                  <figcaption>
                    <strong>{x.personName}</strong>
                    {[x.personTitle, x.institution].filter(Boolean).length ? <span>{[x.personTitle, x.institution].filter(Boolean).join('، ')}</span> : null}
                    {x.source ? <span className="testimonial__context">{x.source}</span> : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">{t('testimonials.empty')}</p>
        )}
      </div>
    </>
  );
}
