import type { Page } from '../../payload-types.ts';
import Link from 'next/link';

type HeroProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'hero' }> & { locale: string };

export function HeroBlock({ eyebrow, heading, lead, image, imageUrl, imageAlt, ctaLabel, ctaUrl, locale }: HeroProps) {
  const mediaUrl = typeof image === 'object' && image !== null ? image.url : undefined;
  const resolvedImg = mediaUrl || imageUrl;

  return (
    <section className="hero" style={{ marginBlockEnd: 'var(--space-8)' }}>
      <div className="container hero__grid">
        <div className="hero__inner">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 style={{ margin: 0 }}>{heading}</h1>
          {lead ? <p className="hero__lead">{lead}</p> : null}
          {ctaLabel && ctaUrl ? (
            <div style={{ marginBlockStart: 'var(--space-3)' }}>
              <Link href={ctaUrl.startsWith('/') ? `/${locale}${ctaUrl}` : ctaUrl} className="btn btn--gold btn--lg">
                {ctaLabel}
              </Link>
            </div>
          ) : null}
        </div>
        {resolvedImg ? (
          <div style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-3)', maxBlockSize: '24rem' }}>
            <img
              src={resolvedImg}
              alt={imageAlt || heading}
              loading="eager"
              style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
