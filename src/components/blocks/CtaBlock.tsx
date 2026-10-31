import type { Page } from '../../payload-types.ts';
import Link from 'next/link';

type CtaProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'ctaBox' }> & { locale: string };

export function CtaBlock({ title, text, buttonLabel, buttonUrl, secondaryButtonLabel, secondaryButtonUrl, locale }: CtaProps) {
  const primaryHref = buttonUrl.startsWith('/') ? `/${locale}${buttonUrl}` : buttonUrl;
  const secondaryHref = secondaryButtonUrl ? (secondaryButtonUrl.startsWith('/') ? `/${locale}${secondaryButtonUrl}` : secondaryButtonUrl) : null;

  return (
    <div className="container--narrow section" style={{ paddingBlock: 'var(--space-8)' }}>
      <div
        style={{
          background: 'var(--brand-fill)',
          color: 'var(--on-brand)',
          borderRadius: 'var(--r-xl)',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-3)',
        }}
      >
        <h2 style={{ fontSize: 'var(--step-3)', color: '#fff', margin: 0 }}>{title}</h2>
        {text ? (
          <p style={{ marginBlockStart: 'var(--space-3)', color: '#dcebe5', fontSize: 'var(--step-0)', maxInlineSize: '36rem', marginInline: 'auto' }}>
            {text}
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap', marginBlockStart: 'var(--space-6)' }}>
          <Link href={primaryHref} className="btn btn--gold btn--lg">
            {buttonLabel}
          </Link>
          {secondaryButtonLabel && secondaryHref ? (
            <Link href={secondaryHref} className="btn btn--secondary btn--lg" style={{ background: 'rgb(255 255 255 / 0.15)', color: '#fff', borderColor: 'rgb(255 255 255 / 0.4)' }}>
              {secondaryButtonLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
