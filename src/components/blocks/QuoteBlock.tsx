import type { Page } from '../../payload-types.ts';
import { Icon } from '../Icon.tsx';

type QuoteProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'quoteCallout' }>;

export function QuoteBlock({ quote, attribution, source, style }: QuoteProps) {
  const isHeritage = style === 'heritage';
  const isHighlight = style === 'highlight';

  const borderColor = isHeritage ? 'var(--gold-500)' : isHighlight ? 'var(--brand)' : 'var(--border-strong)';
  const bgColor = isHeritage ? 'var(--gold-soft)' : isHighlight ? 'var(--brand-soft)' : 'var(--surface-2)';

  return (
    <div className="container--narrow section" style={{ paddingBlock: 'var(--space-6)' }}>
      <blockquote
        style={{
          margin: 0,
          padding: 'var(--space-6)',
          borderRadius: 'var(--r-lg)',
          borderInlineStart: `4px solid ${borderColor}`,
          background: bgColor,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <span style={{ color: borderColor, flexShrink: 0, paddingBlockStart: '0.2rem' }}>
            <Icon name="quote" style={{ inlineSize: '1.75rem', blockSize: '1.75rem' }} />
          </span>
          <div style={{ flexGrow: 1 }}>
            <p style={{ margin: 0, fontSize: 'var(--step-1)', lineHeight: 1.6, fontStyle: 'italic' }}>
              {quote}
            </p>
            {attribution || source ? (
              <footer style={{ marginBlockStart: 'var(--space-3)', fontSize: 'var(--step--1)', color: 'var(--muted)' }}>
                {attribution ? <strong style={{ color: 'var(--text)' }}>{attribution}</strong> : null}
                {attribution && source ? <span> — </span> : null}
                {source ? <cite>{source}</cite> : null}
              </footer>
            ) : null}
          </div>
        </div>
      </blockquote>
    </div>
  );
}
