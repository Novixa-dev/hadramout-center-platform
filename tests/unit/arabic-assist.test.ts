import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScholarlyArabic, auditScholarlyArabic } from '../../src/lib/arabic-assist.ts';

describe('scholarly Arabic assistant & normalizer', () => {
  test('removes space before punctuation marks and ensures trailing space', () => {
    const input = 'حضرموت ،تاريخ عريق . وثقافة أصيلة';
    const expected = 'حضرموت، تاريخ عريق. وثقافة أصيلة';
    assert.equal(normalizeScholarlyArabic(input), expected);
  });

  test('converts Latin commas and question marks in Arabic text', () => {
    const input = 'المكلا, الشحر, وتريم?';
    const expected = 'المكلا، الشحر، وتريم؟';
    assert.equal(normalizeScholarlyArabic(input), expected);
  });

  test('converts straight double quotes to traditional Arabic brackets', () => {
    const input = 'قال المؤرخ "حضرموت مهد الحضارة" في كتابه';
    const expected = 'قال المؤرخ «حضرموت مهد الحضارة» في كتابه';
    assert.equal(normalizeScholarlyArabic(input), expected);
  });

  test('deduplicates repetitive punctuation marks', () => {
    const input = 'هل هذا صحيح؟؟ نعم،، بالتاكيد!!';
    const expected = 'هل هذا صحيح؟ نعم، بالتاكيد!';
    assert.equal(normalizeScholarlyArabic(input), expected);
  });

  test('auditScholarlyArabic produces actionable suggestions', () => {
    const input = 'تاريخ حضرموت ،حافل و"عظيم"';
    const suggestions = auditScholarlyArabic(input);
    assert.ok(suggestions.length >= 2);
    assert.ok(suggestions.some((s) => s.type === 'punctuation'));
    assert.ok(suggestions.some((s) => s.type === 'quotes'));
  });
});
