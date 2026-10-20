import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate, median, toMarkdown } from '../../scripts/lighthouse-median.mjs';

test('median ignores missing values and handles odd and even counts', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([null, undefined, NaN, 5]), 5);
  assert.equal(median([]), null);
  assert.equal(median([null]), null);
});

const row = (over: Record<string, unknown>) => ({ path: '/ar', preset: 'mobile', performance: 70, accessibility: 100, seo: 100, fcpMs: 1500, lcpMs: 3000, tbtMs: 900, cls: 0.01, ...over });

test('aggregate takes the median per page and preset and drops failed runs', () => {
  const runs = [
    { rows: [row({ performance: 60, lcpMs: 4000 }), row({ path: '/ar/articles', performance: 90 })] },
    { rows: [row({ performance: 80, lcpMs: 3000 }), row({ path: '/ar/articles', performance: 92 })] },
    { rows: [row({ performance: null, lcpMs: null, runtimeError: 'NO_NAVSTART' }), row({ path: '/ar/articles', performance: 94 })] },
  ];
  const out = aggregate(runs);
  const home = out.find((r: { path: string }) => r.path === '/ar')!;
  assert.equal(home.runs, 3);
  assert.equal(home.valid, 2, 'the NO_NAVSTART run is not counted');
  assert.equal(home.performance, 70);
  assert.equal(home.lcpMs, 3500);
  assert.equal(out.find((r: { path: string }) => r.path === '/ar/articles')!.performance, 92);
});

test('the markdown report marks pass/fail against the targets and shows n/a for missing data', () => {
  const md = toMarkdown(aggregate([{ rows: [row({ performance: 85, lcpMs: 2000, tbtMs: 700 })] }, { rows: [{ path: '/x', preset: 'mobile', error: 'boom' }] }]));
  assert.match(md, /\| `\/ar` \| mobile \| 85 ✅ \| 2000 ✅ \| 700 ❌ \|/);
  assert.match(md, /\| `\/x` \| mobile \| n\/a \|/);
  assert.match(md, /Report only/);
});
