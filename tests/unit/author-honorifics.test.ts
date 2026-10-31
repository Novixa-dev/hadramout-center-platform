import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { authorsOf } from '../../src/lib/ctx.ts';
import { contentJsonLd } from '../../src/lib/jsonld.ts';
import type { Doc } from '../../src/lib/data.ts';

registerHooks({ resolve: (spec, ctx, next) => next(spec === 'next/cache' ? 'next/cache.js' : spec, ctx) });
const { Authors } = await import('../../src/collections/Authors.ts');

describe('Author honorifics and scholarly presentation', () => {
  it('Authors collection contains honorific field with bilingual labels', () => {
    const honorificField = Authors.fields.find(
      (f) => 'name' in f && f.name === 'honorific'
    ) as { name: string; type: string; localized?: boolean; label?: Record<string, string> } | undefined;

    assert.ok(honorificField, 'honorific field must be present in Authors collection');
    assert.equal(honorificField.type, 'text');
    assert.equal(honorificField.localized, true);
    assert.ok(honorificField.label?.ar, 'must have Arabic label');
    assert.ok(honorificField.label?.en, 'must have English label');
  });

  it('authorsOf extracts honorific alongside author name', () => {
    const mockDoc = {
      id: 1,
      title: 'بحث تاريخي',
      authors: [
        { id: 10, name: 'عبدالقادر باعيسى', honorific: 'د.' },
        { id: 11, name: 'سعيد بن جسار', honorific: null },
      ],
    } as unknown as Doc;

    const extracted = authorsOf(mockDoc);
    assert.equal(extracted.length, 2);
    assert.equal(extracted[0].name, 'عبدالقادر باعيسى');
    assert.equal(extracted[0].honorific, 'د.');
    assert.equal(extracted[1].name, 'سعيد بن جسار');
    assert.equal(extracted[1].honorific, null);
  });

  it('contentJsonLd formats Schema.org Person with honorificPrefix when present', () => {
    const mockDoc = {
      id: 1,
      title: 'بحث تاريخي',
      excerpt: 'ملخص البحث',
      authors: [
        { id: 10, name: 'عبدالقادر باعيسى', honorific: 'د.' },
      ],
    } as unknown as Doc;

    const json = contentJsonLd({
      type: 'article',
      doc: mockDoc,
      url: 'https://hadramout-center.novixa.dev/ar/articles/1',
      lang: 'ar',
      org: { name: 'مركز حضرموت', origin: 'https://hadramout-center.novixa.dev', logo: 'https://hadramout-center.novixa.dev/logo.png' },
      authorUrl: (id) => `https://hadramout-center.novixa.dev/ar/authors/${id}`,
      pdf: null,
      issue: null,
      category: null,
      rating: null,
    });

    const author = (json.author as Array<{ '@type': string; name: string; honorificPrefix?: string }>)?.[0];
    assert.ok(author, 'author must exist in JSON-LD');
    assert.equal(author.name, 'عبدالقادر باعيسى');
    assert.equal(author.honorificPrefix, 'د.');
  });
});
