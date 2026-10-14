import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localizeLegacyMedia, resolveLegacyPath } from '../../src/lib/legacy-media.ts';

test('rewrites old-site media URLs in HTML', () => {
  const html = '<img src="https://files.hadramout.center/media/2023/10/a-1024x683.jpg"><a href="https://example.com/x.jpg">x</a>';
  assert.equal(localizeLegacyMedia(html), '<img src="/legacy-media/2023/10/a-1024x683.jpg"><a href="https://example.com/x.jpg">x</a>');
});

test('accepts normal media paths', () => {
  const r = resolveLegacyPath(['2023', '10', 'PHOTO-2023-10-20.jpg']);
  assert.ok(r);
  assert.equal(r.rel, '2023/10/PHOTO-2023-10-20.jpg');
});

test('rejects traversal, odd extensions and empty segments', () => {
  assert.equal(resolveLegacyPath(['..', 'payload.db']), null);
  assert.equal(resolveLegacyPath(['2023', '..%2F..%2Fx.jpg']), null);
  assert.equal(resolveLegacyPath(['2023', 'a.php']), null);
  assert.equal(resolveLegacyPath(['2023', '', 'a.jpg']), null);
  assert.equal(resolveLegacyPath(['a\b.jpg']), null);
});

test('accepts Arabic file names', () => {
  assert.ok(resolveLegacyPath(['2025', '12', 'الزراعة.jpg']));
  assert.ok(resolveLegacyPath(['2025', '12', encodeURIComponent('الزراعة (1).jpg')]));
});
