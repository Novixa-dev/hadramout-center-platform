import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absolute } from '../../src/lib/ctx.ts';
import { PERIODICAL_NAME } from '../../src/lib/periodical.ts';
import { contentJsonLd } from '../../src/lib/jsonld.ts';

test('absolute() prefixes site paths but passes external URLs through unchanged', () => {
  assert.match(absolute('/ar/books/1'), /^https?:\/\/[^/]+\/ar\/books\/1$/);
  assert.equal(absolute('https://i.ytimg.com/vi/abc/hqdefault.jpg'), 'https://i.ytimg.com/vi/abc/hqdefault.jpg');
});

test('magazine JSON-LD names the periodical, not the issue', () => {
  const ld = contentJsonLd({
    type: 'magazine',
    doc: { id: 6, title: `${PERIODICAL_NAME} العدد 6`, issueNumber: 6, updatedAt: '2025-01-01T00:00:00.000Z' } as never,
    url: 'https://example.org/ar/magazines/6',
    lang: 'ar',
    image: null,
    org: { name: 'مركز حضرموت', origin: 'https://example.org', logo: 'https://example.org/i.png' },
    authorUrl: () => '',
  } as never) as { isPartOf: { name: string } };
  assert.equal(ld.isPartOf.name, PERIODICAL_NAME);
});
