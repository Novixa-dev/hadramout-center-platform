import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { STAGING_ROBOTS_HEADER, isProductionSite } from '../../src/lib/site-env.ts';

const original = process.env.SITE_ENV;
afterEach(() => {
  if (original === undefined) delete process.env.SITE_ENV;
  else process.env.SITE_ENV = original;
});

test('staging is the default: only the exact value "production" makes the site indexable', () => {
  delete process.env.SITE_ENV;
  assert.equal(isProductionSite(), false);
  for (const v of ['', 'staging', 'Production', 'PRODUCTION', 'prod', '1', 'true', ' production']) {
    process.env.SITE_ENV = v;
    assert.equal(isProductionSite(), false, JSON.stringify(v));
  }
  process.env.SITE_ENV = 'production';
  assert.equal(isProductionSite(), true);
});

test('it is read when asked, not frozen at import time', () => {
  process.env.SITE_ENV = 'production';
  assert.equal(isProductionSite(), true);
  process.env.SITE_ENV = 'staging';
  assert.equal(isProductionSite(), false);
});

test('the staging header forbids indexing, link following and cached copies', () => {
  assert.match(STAGING_ROBOTS_HEADER, /noindex/);
  assert.match(STAGING_ROBOTS_HEADER, /nofollow/);
  assert.match(STAGING_ROBOTS_HEADER, /noarchive/);
});
