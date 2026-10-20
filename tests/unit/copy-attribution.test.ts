import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_ATTRIBUTION_CHARS, needsAttribution, withAttribution } from '../../src/lib/copy-attribution.ts';

test('short selections (a word, a name, a date) are never touched', () => {
  assert.equal(needsAttribution('حضرموت'), false);
  assert.equal(needsAttribution('   '), false);
  assert.equal(needsAttribution('x'.repeat(MIN_ATTRIBUTION_CHARS - 1)), false);
});

test('a passage gets attributed; surrounding whitespace does not count towards the length', () => {
  assert.equal(needsAttribution('x'.repeat(MIN_ATTRIBUTION_CHARS)), true);
  assert.equal(needsAttribution(`   ${'x'.repeat(MIN_ATTRIBUTION_CHARS - 1)}   `), false);
});

test('the clipboard text is the passage, a blank line, then the source line', () => {
  const line = 'المصدر: «عنوان» — المركز\nhttps://example.org/ar/articles/1';
  assert.equal(withAttribution('  نص مقتبس  ', line), `نص مقتبس\n\n${line}`);
});
