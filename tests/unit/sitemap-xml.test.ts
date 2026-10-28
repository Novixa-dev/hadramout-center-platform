import { test } from 'node:test';
import assert from 'node:assert/strict';
import { urlset } from '../../src/lib/sitemap-xml.ts';

const opts = { keep: (l: string) => l === 'ar' || l === 'en', tag: (l: string) => l };
const base = 'https://example.org';

test('one url per kept language with every alternate and x-default, and no priority or changefreq', () => {
  const xml = urlset(base, [{ path: '/books/1', langs: ['ar', 'en', 'fr'], lastmod: '2026-10-21T08:00:00.000Z' }], opts);
  assert.equal((xml.match(/<url>/g) ?? []).length, 2, 'fr is not indexable here');
  assert.match(xml, /<loc>https:\/\/example\.org\/ar\/books\/1<\/loc>/);
  assert.match(xml, /<loc>https:\/\/example\.org\/en\/books\/1<\/loc>/);
  assert.match(xml, /hreflang="x-default" href="https:\/\/example\.org\/ar\/books\/1"/);
  assert.equal((xml.match(/hreflang="en"/g) ?? []).length, 2, 'both urls list the en alternate');
  assert.doesNotMatch(xml, /priority|changefreq/);
});

test('lastmod is a plain date and is omitted when unknown or malformed', () => {
  const xml = urlset(base, [{ path: '/a', langs: ['ar'], lastmod: '2026-10-21T08:00:00.000Z' }, { path: '/b', langs: ['ar'] }, { path: '/c', langs: ['ar'], lastmod: 'yesterday' }], opts);
  assert.match(xml, /<lastmod>2026-10-21<\/lastmod>/);
  assert.equal((xml.match(/<lastmod>/g) ?? []).length, 1);
});

test('the home page has no trailing path, special characters are escaped and entries without a listable language are skipped', () => {
  const xml = urlset(base, [{ path: '', langs: ['ar'] }, { path: '/x?a=1&b=2', langs: ['ar'] }, { path: '/none', langs: ['fr'] }], opts);
  assert.match(xml, /<loc>https:\/\/example\.org\/ar<\/loc>/);
  assert.match(xml, /a=1&amp;b=2/);
  assert.doesNotMatch(xml, /\/none/);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
});

test('quotes cannot break out of the hreflang/href attributes', () => {
  const xml = urlset(base, [{ path: `/x"y'z`, langs: ['ar'] }], opts);
  assert.match(xml, /href="https:\/\/example\.org\/ar\/x&quot;y&apos;z"/);
  assert.doesNotMatch(xml, /x"y/);
});
