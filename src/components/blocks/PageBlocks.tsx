import type { Page } from '../../payload-types.ts';
import { HeroBlock } from './HeroBlock.tsx';
import { RichTextBlock } from './RichTextBlock.tsx';
import { HeadingBlock } from './HeadingBlock.tsx';
import { TextWithImageBlock } from './TextWithImageBlock.tsx';
import { CardGridBlock } from './CardGridBlock.tsx';
import { QuoteBlock } from './QuoteBlock.tsx';
import { MediaEmbedBlock } from './MediaEmbedBlock.tsx';
import { DownloadBlock } from './DownloadBlock.tsx';
import { StatsBlock } from './StatsBlock.tsx';
import { AccordionBlock } from './AccordionBlock.tsx';
import { CtaBlock } from './CtaBlock.tsx';

export function PageBlocks({ blocks, locale }: { blocks?: Page['blocks']; locale: string }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="page-blocks">
      {blocks.map((block, idx) => {
        const key = block.id || `${block.blockType}-${idx}`;
        switch (block.blockType) {
          case 'hero':
            return <HeroBlock key={key} {...block} locale={locale} />;
          case 'richText':
            return <RichTextBlock key={key} {...block} />;
          case 'sectionHeading':
            return <HeadingBlock key={key} {...block} />;
          case 'textWithImage':
            return <TextWithImageBlock key={key} {...block} />;
          case 'cardGrid':
            return <CardGridBlock key={key} {...block} locale={locale} />;
          case 'quoteCallout':
            return <QuoteBlock key={key} {...block} />;
          case 'mediaEmbed':
            return <MediaEmbedBlock key={key} {...block} />;
          case 'fileDownload':
            return <DownloadBlock key={key} {...block} />;
          case 'statsStrip':
            return <StatsBlock key={key} {...block} />;
          case 'accordionFaq':
            return <AccordionBlock key={key} {...block} />;
          case 'ctaBox':
            return <CtaBlock key={key} {...block} locale={locale} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
