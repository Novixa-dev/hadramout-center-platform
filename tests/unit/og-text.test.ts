import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clip, describe as describeText } from '../../src/lib/seo-text.ts';

test('direction controls from imported titles never reach a preview', () => {
  assert.equal(clip('المؤتمر العلمي الرابع الحضارمة⁩ في القرن', 200), 'المؤتمر العلمي الرابع الحضارمة في القرن');
  assert.equal(describeText('⁨نص⁩ تجريبي طويل بما يكفي ليكون وصفاً‏'), 'نص تجريبي طويل بما يكفي ليكون وصفاً');
});
