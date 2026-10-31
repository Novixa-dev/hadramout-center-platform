import type { Page } from '../../payload-types.ts';

type RichTextProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'richText' }>;

export function RichTextBlock({ content }: RichTextProps) {
  if (!content) return null;
  return (
    <section className="container--narrow section" style={{ paddingBlock: 'var(--space-4)' }}>
      <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );
}
