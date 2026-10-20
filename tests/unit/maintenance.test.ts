import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAINTENANCE_HTML, isMaintenanceExempt } from '../../src/lib/maintenance.ts';

test('admin, API, static assets and crawler files stay reachable during maintenance', () => {
  for (const p of ['/admin', '/admin/collections/news', '/api/hc/health', '/api/users/login', '/_next/static/chunks/a.js', '/brand/logo.svg', '/icons/icon-192.png', '/fonts/a.woff2', '/favicon.ico', '/robots.txt']) {
    assert.equal(isMaintenanceExempt(p), true, p);
  }
});

test('public pages are not exempt (including look-alike prefixes)', () => {
  for (const p of ['/', '/ar', '/ar/articles/1', '/en/search', '/administrator', '/apiary', '/_nextgen', '/iconsx', '/feeds/ar/all.xml', '/sitemap.xml']) {
    assert.equal(isMaintenanceExempt(p), false, p);
  }
});

test('the maintenance page is self-contained, Arabic first, with an English line and noindex', () => {
  assert.match(MAINTENANCE_HTML, /<html lang="ar" dir="rtl">/);
  assert.match(MAINTENANCE_HTML, /name="robots" content="noindex"/);
  assert.match(MAINTENANCE_HTML, /lang="en"/);
  assert.doesNotMatch(MAINTENANCE_HTML, /<script|<link |https?:\/\//i, 'no external or scripted resources');
});
