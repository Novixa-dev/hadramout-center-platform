import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { byYear, yearLabel, yearRange, type YearLabels } from '../../src/lib/timeline.ts';

const ar: YearLabels = { bce: (n) => `${n} ق.م`, ce: (n) => `${n} م` };

describe('timeline year labels', () => {
  test('single years', () => {
    assert.equal(yearLabel(-800, ar), '800 ق.م');
    assert.equal(yearLabel(1967, ar), '1967');
  });
  test('the ambiguous "800 BCE – 300" range names both eras', () => assert.equal(yearRange(-800, 300, ar), '800 ق.م – 300 م'));
  test('BCE-only and CE-only ranges carry one unit', () => {
    assert.equal(yearRange(-800, -300, ar), '800 – 300 ق.م');
    assert.equal(yearRange(300, 600, ar), '300 – 600');
  });
  test('equal or missing end year is a single year', () => {
    assert.equal(yearRange(1500, 1500, ar), '1500');
    assert.equal(yearRange(1500, null, ar), '1500');
  });
  test('chronological ordering puts BCE first and breaks ties by end year', () => {
    const list = [{ yearFrom: 300, yearTo: 400 }, { yearFrom: -800, yearTo: 300 }, { yearFrom: 300, yearTo: 350 }];
    assert.deepEqual(list.sort(byYear).map((e) => [e.yearFrom, e.yearTo]), [[-800, 300], [300, 350], [300, 400]]);
  });
});
