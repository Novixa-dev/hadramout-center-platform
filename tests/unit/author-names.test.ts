import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergeBareTitles, splitHonorific } from '../../src/lib/author-names.ts';

describe('splitHonorific: legacy author titles move to their own field', () => {
  const cases: [string, { name: string; honorific: string }][] = [
    ['أ.د. أحمد إبراهيم محتسب حنشور', { name: 'أحمد إبراهيم محتسب حنشور', honorific: 'أ.د.' }],
    ['أ.د أحمد', { name: 'أحمد', honorific: 'أ.د.' }],
    ['الأستاذ الدكتور سعيد بن جسار', { name: 'سعيد بن جسار', honorific: 'أ.د.' }],
    ['أ.م.د عبدالله بكير', { name: 'عبدالله بكير', honorific: 'أ.م.د.' }],
    ['د. بدر العرابي', { name: 'بدر العرابي', honorific: 'د.' }],
    ['د بدر العرابي', { name: 'بدر العرابي', honorific: 'د.' }],
    ['الدكتور بدر العرابي', { name: 'بدر العرابي', honorific: 'د.' }],
    ['الشيخ: عبدالله باوزير', { name: 'عبدالله باوزير', honorific: 'الشيخ' }],
    ['الباحث / سالم العامري', { name: 'سالم العامري', honorific: 'الباحث' }],
    ['القاضي علي بن سالم', { name: 'علي بن سالم', honorific: 'القاضي' }],
    ['م. صالح الفردي', { name: 'صالح الفردي', honorific: 'م.' }],
    ['أ. د. طه حسين هُديل', { name: 'طه حسين هُديل', honorific: 'أ.د.' }],
    ['أ. عوض عمر حسان', { name: 'عوض عمر حسان', honorific: 'أ.' }],
    ['أ.جهاد برك نصير', { name: 'جهاد برك نصير', honorific: 'أ.' }],
  ];
  for (const [raw, want] of cases) {
    it(raw, () => assert.deepEqual(splitHonorific(raw), want));
  }

  it('an editorial role after the name is dropped together with the title', () => {
    assert.deepEqual(splitHonorific('د. عبدالقادر باعيسى - رئيس التحرير'), { name: 'عبدالقادر باعيسى', honorific: 'د.' });
    assert.deepEqual(splitHonorific('عبدالقادر باعيسى – رئيس التحرير'), { name: 'عبدالقادر باعيسى', honorific: '' });
  });

  it('plain names, a bare title and foreign initials are left alone', () => {
    assert.equal(splitHonorific('عبدالله عبدالرحمن بكير'), null);
    assert.equal(splitHonorific('أ.م.د'), null, 'a title with no name is for the editors, not a split');
    assert.equal(splitHonorific('الشيخ'), null);
    assert.equal(splitHonorific('م.أ. رودينوف'), null, 'Russian initials are not the engineer title');
  });

  it('is idempotent: splitting the remainder finds nothing more', () => {
    const once = splitHonorific('أ.د. فلان الفلاني');
    assert.ok(once);
    assert.equal(splitHonorific(once.name), null);
  });
});

describe('mergeBareTitles: bylines the legacy export cut at a slash', () => {
  it('glues a bare title back onto the name after it', () => {
    assert.deepEqual(mergeBareTitles(['أ.م.د', 'عبدالله عبدالرحمن بكير']), ['أ.م.د عبدالله عبدالرحمن بكير']);
    assert.deepEqual(mergeBareTitles(['الشيخ', 'أمين سعيد عوض باوزير', 'سالم العامري']), ['الشيخ أمين سعيد عوض باوزير', 'سالم العامري']);
  });
  it('keeps ordinary names, a trailing fragment and two titles in a row as they are', () => {
    assert.deepEqual(mergeBareTitles(['سالم العامري', 'علي بن سالم']), ['سالم العامري', 'علي بن سالم']);
    assert.deepEqual(mergeBareTitles(['سالم العامري', 'الشيخ']), ['سالم العامري', 'الشيخ']);
    assert.deepEqual(mergeBareTitles(['الشيخ', 'د']), ['الشيخ', 'د']);
  });
  it('the merged byline then splits into title and name', () => {
    const [merged] = mergeBareTitles(['أ.م.د', 'عبدالله عبدالرحمن بكير']);
    assert.deepEqual(splitHonorific(merged as string), { name: 'عبدالله عبدالرحمن بكير', honorific: 'أ.م.د.' });
  });
});
