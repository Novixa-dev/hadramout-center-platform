import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { notifyIndexNow } from '../../src/lib/indexnow.ts';

describe('IndexNow protocol', () => {
  test('returns false and does not ping when not in production', async () => {
    // In test environment, SITE_ENV is 'staging' or unset
    const ok = await notifyIndexNow(['https://hadramout.center/ar/articles/1']);
    assert.equal(ok, false);
  });

  test('returns false when urlList is empty', async () => {
    const ok = await notifyIndexNow([]);
    assert.equal(ok, false);
  });
});
