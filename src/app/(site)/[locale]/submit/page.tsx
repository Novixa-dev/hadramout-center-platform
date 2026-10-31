import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { Icon } from '../../../../components/Icon.tsx';
import { PageHead } from '../../../../components/PageHead.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({
    ctx,
    path: '/submit',
    title: ctx.t('submit.title'),
    description: ctx.t('submit.lead'),
    card: { key: 'submit' },
  });
}

export default async function SubmitPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, lang } = ctx;
  const site = await getSite(locale);
  const editorEmail = site.email || 'info@hadramout-center.org';

  const crumbs = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${lang.code}`) },
    { name: t('submit.title'), url: absolute(`/${lang.code}/submit`) },
  ]);

  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('submit.title') }]} title={t('submit.title')} lead={t('submit.lead')} />
      <div className="container--narrow section stack" style={{ '--stack': 'var(--space-8)' } as React.CSSProperties}>
        {/* Status notice regarding Direct Digital Upload (DEC-09) */}
        <div className="notice notice--info" role="status" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 'var(--step-0)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon name="info" /> {t('submit.portalNotice.title')}
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--step--1)', color: 'var(--text-2)', lineHeight: 1.7 }}>
            {t('submit.portalNotice.desc')}
          </p>
        </div>

        {/* Magazine standards */}
        <section aria-labelledby="magazine-standards-h" className="stack" style={{ '--stack': 'var(--space-3)' } as React.CSSProperties}>
          <h2 id="magazine-standards-h" style={{ fontSize: 'var(--step-2)' }}>{t('submit.magazine.title')}</h2>
          <p style={{ color: 'var(--text-2)', marginBlockEnd: 'var(--space-2)' }}>{t('submit.magazine.p1')}</p>
          <ul className="stack" style={{ '--stack': 'var(--space-2)', paddingInlineStart: 'var(--space-5)' } as React.CSSProperties}>
            <li>{t('submit.magazine.rule1')}</li>
            <li>{t('submit.magazine.rule2')}</li>
            <li>{t('submit.magazine.rule3')}</li>
            <li>{t('submit.magazine.rule4')}</li>
          </ul>
        </section>

        {/* Peer review process */}
        <section aria-labelledby="peer-review-h" className="box box--tint stack" style={{ '--stack': 'var(--space-2)' } as React.CSSProperties}>
          <h2 id="peer-review-h" style={{ fontSize: 'var(--step-1)' }}>{t('submit.review.title')}</h2>
          <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--text-1)' }}>{t('submit.review.desc')}</p>
        </section>

        {/* Research ethics */}
        <section aria-labelledby="ethics-h" className="stack" style={{ '--stack': 'var(--space-2)' } as React.CSSProperties}>
          <h2 id="ethics-h" style={{ fontSize: 'var(--step-1)' }}>{t('submit.ethics.title')}</h2>
          <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--text-2)' }}>{t('submit.ethics.desc')}</p>
        </section>

        {/* Checklist */}
        <section aria-labelledby="checklist-h" className="box stack" style={{ '--stack': 'var(--space-3)', border: '1px solid var(--border)' } as React.CSSProperties}>
          <h2 id="checklist-h" style={{ fontSize: 'var(--step-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon name="bookmark" /> {t('submit.checklist.title')}
          </h2>
          <ul className="stack" style={{ '--stack': 'var(--space-2)', paddingInlineStart: 'var(--space-5)' } as React.CSSProperties}>
            <li>{t('submit.checklist.item1')}</li>
            <li>{t('submit.checklist.item2')}</li>
            <li>{t('submit.checklist.item3')}</li>
            <li>{t('submit.checklist.item4')}</li>
          </ul>
        </section>

        {/* Contact editorial channel */}
        <div className="card stack" style={{ '--stack': 'var(--space-4)', padding: 'var(--space-6)', textAlign: 'center', backgroundColor: 'var(--surface-2)' } as React.CSSProperties}>
          <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>{t('submit.editorialEmail')}</h2>
          <p style={{ margin: 0, fontSize: 'var(--step-1)', fontWeight: 'bold' }}>
            <a href={`mailto:${editorEmail}`} dir="ltr">{editorEmail}</a>
          </p>
          <div>
            <a className="btn btn--primary" href={`mailto:${editorEmail}?subject=${encodeURIComponent(t('submit.title'))}`}>
              <Icon name="mail" /> {t('submit.sendEmail')}
            </a>
          </div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
