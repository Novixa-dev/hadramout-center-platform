import type { Page } from '../../payload-types.ts';

type StatsProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'statsStrip' }>;

export function StatsBlock({ items }: StatsProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="strip section" style={{ marginBlock: 'var(--space-6)', paddingBlock: 'var(--space-6)' }}>
      <div className="container">
        <ul className="stats" style={{ justifyContent: 'space-around', alignItems: 'center' }}>
          {items.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 'var(--space-1)',
              }}
            >
              <strong style={{ fontSize: 'var(--step-4)', color: 'var(--brand)', lineHeight: 1.1 }}>{item.value}</strong>
              <span style={{ fontSize: 'var(--step-0)', fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
              {item.description ? (
                <small style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>{item.description}</small>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
