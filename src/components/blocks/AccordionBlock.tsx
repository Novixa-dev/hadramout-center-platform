import type { Page } from '../../payload-types.ts';

type AccordionProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'accordionFaq' }>;

export function AccordionBlock({ title, items }: AccordionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="container--narrow section" style={{ paddingBlock: 'var(--space-6)' }}>
      {title ? <h2 style={{ fontSize: 'var(--step-2)', marginBlockEnd: 'var(--space-4)' }}>{title}</h2> : null}
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {items.map((item, idx) => (
          <details
            key={idx}
            className="accordion-item"
            style={{
              background: 'var(--surface-2)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              padding: 'var(--space-4)',
              transition: 'background var(--t-fast) var(--ease)',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 'var(--step-0)',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              {item.question}
            </summary>
            <div
              className="prose"
              style={{ marginBlockStart: 'var(--space-3)', paddingBlockStart: 'var(--space-3)', borderBlockStart: '1px solid var(--border)' }}
              dangerouslySetInnerHTML={{ __html: item.answer }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}
