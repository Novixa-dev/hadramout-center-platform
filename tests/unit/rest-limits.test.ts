import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampRestQuery } from '../../src/lib/rest-limits.ts';

test('leaves compliant queries untouched', () => {
  assert.equal(clampRestQuery(''), null);
  assert.equal(clampRestQuery('?limit=20&depth=2&page=2'), null);
  assert.equal(clampRestQuery('?limit=100&depth=0'), null);
});

test('caps oversize limit and depth', () => {
  assert.equal(clampRestQuery('?limit=1000&depth=3&where[x]=1'), new URLSearchParams('limit=100&depth=2&where[x]=1').toString());
});

test('limit=0 (unlimited in Payload) and junk values are capped', () => {
  assert.equal(new URLSearchParams(clampRestQuery('?limit=0') ?? '').get('limit'), '100');
  assert.equal(new URLSearchParams(clampRestQuery('?limit=abc&depth=NaN') ?? '').get('limit'), '100');
  assert.equal(new URLSearchParams(clampRestQuery('?depth=-5') ?? '').get('depth'), '0');
});
