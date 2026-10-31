import type { Page } from '../../payload-types.ts';
import { Icon } from '../Icon.tsx';
import { localizeLegacyMedia } from '../../lib/legacy-media.ts';

type DownloadProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'fileDownload' }>;

export function DownloadBlock({ title, description, file, fileUrl, fileSize, fileType }: DownloadProps) {
  const mediaUrl = typeof file === 'object' && file !== null ? file.url : undefined;
  const rawTarget = mediaUrl || fileUrl;
  if (!rawTarget) return null;
  const resolvedTarget = localizeLegacyMedia(rawTarget);

  return (
    <div className="container--narrow section" style={{ paddingBlock: 'var(--space-4)' }}>
      <a
        href={resolvedTarget}
        download
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          padding: 'var(--space-5)',
          background: 'var(--surface-2)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'border-color var(--t-fast) var(--ease), background var(--t-fast) var(--ease)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexGrow: 1 }}>
          <span
            style={{
              display: 'inline-flex',
              padding: '0.85rem',
              borderRadius: 'var(--r-md)',
              background: 'var(--brand-soft)',
              color: 'var(--brand)',
              flexShrink: 0,
            }}
          >
            <Icon name="file" style={{ inlineSize: '1.75rem', blockSize: '1.75rem' }} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 'var(--step-0)' }}>{title}</strong>
              {fileType ? (
                <span className="chip" style={{ fontSize: 'var(--step--2)', paddingInline: '0.5rem', paddingBlock: '0.1rem' }}>
                  {fileType}
                </span>
              ) : null}
            </div>
            {description ? <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--step--1)', marginBlockStart: '0.2rem' }}>{description}</p> : null}
            {fileSize ? <span style={{ color: 'var(--muted)', fontSize: 'var(--step--2)' }}>{fileSize}</span> : null}
          </div>
        </div>
        <span className="btn btn--secondary btn--sm" style={{ flexShrink: 0 }}>
          <Icon name="download" style={{ inlineSize: '1rem', blockSize: '1rem' }} />
          <span>تنزيل</span>
        </span>
      </a>
    </div>
  );
}
