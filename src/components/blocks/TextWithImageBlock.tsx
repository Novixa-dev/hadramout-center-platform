import type { Page } from '../../payload-types.ts';

type TextWithImageProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'textWithImage' }>;

export function TextWithImageBlock({ title, body, image, imageUrl, imageAlt, imagePosition }: TextWithImageProps) {
  const mediaUrl = typeof image === 'object' && image !== null ? image.url : undefined;
  const resolvedImg = mediaUrl || imageUrl;
  const isStart = imagePosition === 'start';

  return (
    <section className="container section" style={{ paddingBlock: 'var(--space-6)' }}>
      <div className="split" style={{ alignItems: 'center' }}>
        <div style={{ order: isStart ? 2 : 1 }}>
          {title ? <h2 style={{ fontSize: 'var(--step-2)', marginBlockEnd: 'var(--space-4)' }}>{title}</h2> : null}
          <div className="prose" dangerouslySetInnerHTML={{ __html: body }} />
        </div>
        {resolvedImg ? (
          <div style={{ order: isStart ? 1 : 2, borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-2)' }}>
            <img
              src={resolvedImg}
              alt={imageAlt || title || ''}
              loading="lazy"
              style={{ inlineSize: '100%', blockSize: 'auto', display: 'block' }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
