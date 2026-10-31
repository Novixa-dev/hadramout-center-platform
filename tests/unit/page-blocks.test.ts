import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// The collections import `next/cache` (revalidation hooks); Next resolves it, plain Node needs the file name.
registerHooks({ resolve: (spec, ctx, next) => next(spec === 'next/cache' ? 'next/cache.js' : spec, ctx) });

const { PAGE_BLOCKS } = await import('../../src/collections/page-blocks.ts');
const { Pages } = await import('../../src/collections/Pages.ts');

describe('page builder blocks catalog', () => {
  const REQUIRED_SLUGS = [
    'hero',
    'richText',
    'sectionHeading',
    'textWithImage',
    'cardGrid',
    'quoteCallout',
    'mediaEmbed',
    'fileDownload',
    'statsStrip',
    'accordionFaq',
    'ctaBox',
  ];

  test('all 11 required block types are defined', () => {
    const presentSlugs = PAGE_BLOCKS.map((b) => b.slug);
    for (const slug of REQUIRED_SLUGS) {
      assert.ok(presentSlugs.includes(slug), `Missing block type: ${slug}`);
    }
  });

  test('every block has bilingual singular and plural labels', () => {
    for (const b of PAGE_BLOCKS) {
      assert.ok(b.labels?.singular, `${b.slug} missing singular label`);
      assert.ok(b.labels?.plural, `${b.slug} missing plural label`);
      const sing = b.labels.singular as { ar?: string; en?: string };
      const plur = b.labels.plural as { ar?: string; en?: string };
      assert.ok(sing.ar && sing.en, `${b.slug} singular missing ar or en`);
      assert.ok(plur.ar && plur.en, `${b.slug} plural missing ar or en`);
    }
  });

  test('Pages collection has tabs with blocks, seo, and navigation', () => {
    const tabsField = Pages.fields.find((f) => f.type === 'tabs') as { tabs?: { label?: unknown; fields?: unknown[] }[] } | undefined;
    assert.ok(tabsField, 'Pages collection missing tabs field');
    assert.equal(tabsField.tabs?.length, 3);
  });

  test('Pages collection has livePreview configuration', () => {
    assert.ok(Pages.admin?.livePreview);
    assert.equal(typeof Pages.admin?.livePreview?.url, 'function');
  });
});
