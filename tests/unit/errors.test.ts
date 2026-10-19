import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNotFound, isPlausibleId } from '../../src/lib/errors.ts';

test('missing or unreadable documents are not-found; other failures are not', () => {
  assert.equal(isNotFound({ status: 404 }), true);
  assert.equal(isNotFound({ status: 403 }), true);
  assert.equal(isNotFound({ status: 500 }), false);
  assert.equal(isNotFound(new Error('SQLITE_BUSY')), false);
  assert.equal(isNotFound(null), false);
});

test('ids beyond the 32-bit range or non-positive are never real documents', () => {
  assert.equal(isPlausibleId(1), true);
  assert.equal(isPlausibleId(2_147_483_647), true);
  assert.equal(isPlausibleId(2_147_483_648), false);
  assert.equal(isPlausibleId(0), false);
  assert.equal(isPlausibleId(Number('99999999999999999999')), false);
  assert.equal(isPlausibleId(NaN), false);
});
