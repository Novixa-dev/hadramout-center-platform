import type { Page } from '../../payload-types.ts';

type HeadingProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'sectionHeading' }>;

export function HeadingBlock({ title, subtitle, align }: HeadingProps) {
  const isCenter = align === 'center';
  return (
    <div
      className="container"
      style={{
        textAlign: isCenter ? 'center' : 'start',
        paddingBlockStart: 'var(--space-6)',
        paddingBlockEnd: 'var(--space-2)',
        marginInline: isCenter ? 'auto' : undefined,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 'var(--step-3)', color: 'var(--brand)' }}>{title}</h2>
      {subtitle ? (
        <p style={{ marginBlockStart: 'var(--space-2)', color: 'var(--muted)', fontSize: 'var(--step-0)', maxInlineSize: '42rem', marginInline: isCenter ? 'auto' : undefined }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
