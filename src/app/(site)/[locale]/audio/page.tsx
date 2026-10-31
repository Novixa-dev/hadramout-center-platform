import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listAudio } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { Icon } from '../../../../components/Icon.tsx';
import { sanitizeBody } from '../../../../lib/sanitize.ts';
import { localizeLegacyMedia } from '../../../../lib/legacy-media.ts';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({
    ctx,
    path: '/audio',
    title: ctx.t('audio.title'),
    description: ctx.t('audio.lead'),
    card: { key: 'audio' },
  });
}

export default async function AudioPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t } = ctx;
  const items = await listAudio(locale);

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-6)' }}>
      <PageHead ctx={ctx} crumbs={[{ name: t('audio.title') }]} title={t('audio.title')} lead={t('audio.lead')} />

      {items.length === 0 ? (
        <p className="empty-state" style={{ marginBlock: 'var(--space-8)', textAlign: 'center', color: 'var(--text-2)' }}>
          {t('audio.empty')}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-5)', marginBlockStart: 'var(--space-6)' }}>
          {items.map((item) => {
            const rawFileUrl = typeof item.audioFile === 'object' && item.audioFile?.url ? item.audioFile.url : null;
            const fileUrl = rawFileUrl ? localizeLegacyMedia(rawFileUrl) : item.audioUrl;

            return (
              <article key={item.id} className="box" style={{ padding: 'var(--space-5)', borderColor: 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    {item.program ? (
                      <span className="kicker" style={{ marginBlockEnd: '0.25rem', display: 'inline-block' }}>
                        {item.program}
                      </span>
                    ) : null}
                    <h2 style={{ fontSize: 'var(--step-1)', marginBlockEnd: 'var(--space-2)' }}>{item.title}</h2>
                    <p style={{ color: 'var(--text-2)', fontSize: 'var(--step--1)', margin: 0, display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                      {item.presenter ? (
                        <span>
                          <Icon name="user" /> {item.presenter}
                        </span>
                      ) : null}
                      {item.duration ? (
                        <span>
                          <Icon name="clock" /> {item.duration}
                        </span>
                      ) : null}
                    </p>
                  </div>

                  {fileUrl ? (
                    <a
                      href={fileUrl}
                      download
                      className="btn btn--secondary"
                      style={{ fontSize: 'var(--step--1)', padding: '0.4rem 0.8rem' }}
                    >
                      <Icon name="download" /> {t('audio.download')}
                    </a>
                  ) : null}
                </div>

                {fileUrl ? (
                  <div style={{ marginBlockStart: 'var(--space-4)' }}>
                    <audio
                      controls
                      preload="none"
                      style={{ width: '100%', height: '42px', borderRadius: '4px' }}
                      src={fileUrl}
                    >
                      <track kind="captions" />
                      {t('audio.listen')}
                    </audio>
                  </div>
                ) : null}

                {item.body ? (
                  <details style={{ marginBlockStart: 'var(--space-4)' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }}>
                      {t('audio.transcript')}
                    </summary>
                    <div
                      className="prose"
                      style={{ marginBlockStart: 'var(--space-3)', paddingInlineStart: 'var(--space-3)', borderInlineStart: '2px solid var(--border)' }}
                      dangerouslySetInnerHTML={{ __html: sanitizeBody(item.body) }}
                    />
                  </details>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
