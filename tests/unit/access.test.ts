import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { Field } from 'payload';
import { lockForReviewers } from '../../src/collections/shared.ts';

type Updatable = { name?: string; access?: { update?: (a: { req: { user: unknown } }) => boolean }; fields?: Updatable[] };
const can = (f: Updatable, role: string) => (f.access?.update ? f.access.update({ req: { user: { role } } }) : true);

describe('reviewer role', () => {
  const custom = () => false;
  const fields = lockForReviewers([
    { name: 'title', type: 'text', localized: true },
    { name: 'status', type: 'select', options: ['draft', 'published'] },
    { type: 'row', fields: [{ name: 'eventDate', type: 'date' }, { name: 'speaker', type: 'text', localized: true }] },
    { name: 'pdf', type: 'text', access: { update: custom } },
  ] as Field[]) as Updatable[];

  test('can still edit localized (translatable) fields', () => {
    assert.ok(can(fields[0]!, 'reviewer'));
    assert.ok(can(fields[2]!.fields![1]!, 'reviewer'));
  });
  test('cannot change status, dates or other non-localized fields, also inside rows', () => {
    assert.equal(can(fields[1]!, 'reviewer'), false);
    assert.equal(can(fields[2]!.fields![0]!, 'reviewer'), false);
  });
  test('editors and admins are unaffected', () => {
    for (const role of ['editor', 'admin']) {
      assert.ok(can(fields[1]!, role));
      assert.ok(can(fields[2]!.fields![0]!, role));
    }
  });
  test('an existing field rule is kept, not replaced', () => assert.equal(fields[3]!.access!.update, custom));
});
