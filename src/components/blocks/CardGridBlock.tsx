import type { Page } from '../../payload-types.ts';
import Link from 'next/link';
import { Icon, type IconName } from '../Icon.tsx';

type CardGridProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'cardGrid' }> & { locale: string };

export function CardGridBlock({ title, subtitle, columns, items, locale }: CardGridProps) {
  if (!items || items.length === 0) return null;
  const colClass = columns === '2' ? 'cards--2' : columns === '4' ? 'cards--4' : 'cards--3';

  return (
    <section className="container section" style={{ paddingBlock: 'var(--space-6)' }}>
      {title ? (
        <div style={{ marginBlockEnd: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--step-2)', margin: 0 }}>{title}</h2>
          {subtitle ? <p style={{ color: 'var(--muted)', marginBlockStart: 'var(--space-1)' }}>{subtitle}</p> : null}
        </div>
      ) : null}
      <div className={`cards--grid ${colClass}`}>
        {items.map((item, idx) => {
          const content = (
            <div
              key={idx}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                padding: 'var(--space-5)',
                background: 'var(--surface-2)',
                borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border)',
                transition: 'transform var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease)',
                textDecoration: 'none',
                color: 'inherit',
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                {item.icon ? (
                  <span style={{ color: 'var(--brand)', display: 'inline-flex', padding: '0.4rem', borderRadius: 'var(--r-sm)', background: 'var(--brand-soft)' }}>
                    <Icon name={item.icon as IconName} style={{ inlineSize: '1.25rem', blockSize: '1.25rem' }} />
                  </span>
                ) : <span />}
                {item.badge ? (
                  <span className="chip" style={{ fontSize: 'var(--step--2)', paddingInline: '0.6rem', paddingBlock: '0.15rem' }}>
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <h3 style={{ fontSize: 'var(--step-0)', margin: 0 }}>{item.title}</h3>
              {item.description ? (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--step--1)', flexGrow: 1, lineHeight: 1.5 }}>
                  {item.description}
                </p>
              ) : null}
              {item.link ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand)', fontSize: 'var(--step--1)', fontWeight: 600, marginBlockStart: 'var(--space-2)' }}>
                  <span>{locale === 'ar' ? 'عرض المزيد' : 'Learn more'}</span>
                  <Icon name="arrow" style={{ inlineSize: '0.9rem', blockSize: '0.9rem' }} />
                </span>
              ) : null}
            </div>
          );

          if (item.link) {
            const href = item.link.startsWith('/') ? `/${locale}${item.link}` : item.link;
            return (
              <Link key={idx} href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                {content}
              </Link>
            );
          }
          return <div key={idx}>{content}</div>;
        })}
      </div>
    </section>
  );
}
