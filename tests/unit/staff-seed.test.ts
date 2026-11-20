import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { checkStaffPassword, parseStaffAccounts } from '../../src/seed/staff.ts';

describe('staff accounts from the environment', () => {
  test('email[:role[:name]], comma-separated, admin by default, emails lower-cased', () => {
    assert.deepEqual(parseStaffAccounts(' Admin@Novixa.dev , admin@hadramout.center:editor:فريق المحتوى, x@y.com:reviewer '), [
      { email: 'admin@novixa.dev', role: 'admin', name: 'مدير النظام' },
      { email: 'admin@hadramout.center', role: 'editor', name: 'فريق المحتوى' },
      { email: 'x@y.com', role: 'reviewer', name: 'مراجع ترجمة' },
    ]);
    assert.deepEqual(parseStaffAccounts(undefined), []);
    assert.deepEqual(parseStaffAccounts(' , '), []);
  });
  test('a typo is an error, not a wrong account', () => {
    assert.throws(() => parseStaffAccounts('admin@novixa'), /not an email/);
    assert.throws(() => parseStaffAccounts('a@b.com:owner'), /unknown role/);
    assert.throws(() => parseStaffAccounts('a@b.com, A@B.com'), /twice/);
  });
  test('the starting password has a minimum length', () => {
    assert.throws(() => checkStaffPassword(undefined));
    assert.throws(() => checkStaffPassword('short'));
    assert.equal(checkStaffPassword('twelve-chars'), 'twelve-chars');
  });
});
