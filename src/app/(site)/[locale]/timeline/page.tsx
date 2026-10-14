import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listTimeline } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/timeline', title: ctx.t('timeline.title'), description: ctx.t('timeline.lead') });
}

export default async function TimelinePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t } = ctx;
  const events = await listTimeline(locale);
  const fmt = (y: number) => (y < 0 ? `${Math.abs(y)} ${t('timeline.bce')}` : String(y));
  return (
    <>
      <div className="page-head">
        <div className="container"><h1>{t('timeline.title')}</h1><p>{t('timeline.lead')}</p></div>
      </div>
      <div className="container--narrow section" style={{ paddingBlockStart: 'var(--space-6)' }}>
        <p className="notice notice--warn" style={{ marginBlockEnd: 'var(--space-6)' }}>{t('timeline.review')}</p>
        <ol className="timeline" style={{ listStyle: 'none', margin: 0 }}>
          {events.map((e) => (
            <li key={e.id} className="timeline__item">
              <p className="timeline__year">{fmt(e.yearFrom)}{e.yearTo ? ` – ${fmt(e.yearTo)}` : ''}{e.era ? <span style={{ color: 'var(--muted)', fontSize: 'var(--step--1)', fontWeight: 500 }}> · {e.era}</span> : null}</p>
              <h2 style={{ fontSize: 'var(--step-1)', marginBlock: '0.3rem' }}>{e.title}</h2>
              {e.body ? <p style={{ color: 'var(--text-2)' }}>{e.body}</p> : null}
              {e.source ? <p style={{ color: 'var(--muted)', fontSize: 'var(--step--2)', marginBlockStart: '0.5rem' }}>{e.source}</p> : null}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
