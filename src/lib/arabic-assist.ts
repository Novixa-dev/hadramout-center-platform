/**
 * Scholarly Arabic Editorial Assistant & Normalizer
 * Provides zero-dependency, local-only typographic corrections, punctuation normalization,
 * and quotation styling for academic and historical publications.
 */

export interface TextSuggestion {
  type: 'punctuation' | 'typography' | 'quotes';
  message: string;
  original: string;
  replacement: string;
  index: number;
}

/**
 * Normalizes punctuation, typography, and quotes according to Arabic scholarly standards:
 * - Clings punctuation to preceding word (no leading space).
 * - Enforces trailing space before subsequent words.
 * - Converts Latin commas and semicolons to Arabic marks (، / ؛).
 * - Converts straight double quotes ("...") into traditional Arabic quotation brackets («...»).
 * - Removes repeated punctuation noise (e.g., "،،" → "،").
 */
export function normalizeScholarlyArabic(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Remove spaces before punctuation marks
  result = result.replace(/\s+([،؛.؟!:])+/gu, '$1');

  // 2. Ensure a space exists after punctuation when followed by an Arabic letter or number
  result = result.replace(/([،؛.؟!:])(?=[\p{Script=Arabic}\p{N}])/gu, '$1 ');

  // 3. Replace Latin commas and semicolons adjacent to Arabic letters
  result = result.replace(/([\p{Script=Arabic}])\s*,\s*([\p{Script=Arabic}])/gu, '$1، $2');
  result = result.replace(/([\p{Script=Arabic}])\s*;\s*([\p{Script=Arabic}])/gu, '$1؛ $2');

  // 4. Replace Latin question mark with Arabic question mark
  result = result.replace(/([\p{Script=Arabic}])\s*\?/gu, '$1؟');

  // 5. Replace straight quotes "text" with Arabic quotation marks «text»
  result = result.replace(/"([^"]+)"/g, '«$1»');

  // 6. Deduplicate accidental double punctuation marks
  result = result.replace(/،{2,}/g, '،');
  result = result.replace(/؛{2,}/g, '؛');
  result = result.replace(/؟{2,}/g, '؟');
  result = result.replace(/!{2,}/g, '!');

  return result;
}

/**
 * Scans Arabic text and produces an advisory list of suggestions for the editor.
 */
export function auditScholarlyArabic(text: string): TextSuggestion[] {
  const suggestions: TextSuggestion[] = [];
  if (!text) return suggestions;

  // Check for space before punctuation
  const spaceBeforePunctRegex = /\s+([،؛.؟!:])+/g;
  let match: RegExpExecArray | null;
  while ((match = spaceBeforePunctRegex.exec(text)) !== null) {
    suggestions.push({
      type: 'punctuation',
      message: `مسافة زائدة قبل علامة الترقيم (${match[1]})`,
      original: match[0],
      replacement: match[1]!,
      index: match.index,
    });
  }

  // Check for missing space after punctuation before Arabic letters
  const missingSpaceAfterRegex = /([،؛.؟!:])(?=[\p{Script=Arabic}])/gu;
  while ((match = missingSpaceAfterRegex.exec(text)) !== null) {
    suggestions.push({
      type: 'punctuation',
      message: `فصل علامة الترقيم (${match[1]}) بمسافة عن الكلمة التالية`,
      original: match[1]!,
      replacement: `${match[1]} `,
      index: match.index,
    });
  }

  // Check for straight quotes
  const straightQuotesRegex = /"([^"]+)"/g;
  while ((match = straightQuotesRegex.exec(text)) !== null) {
    suggestions.push({
      type: 'quotes',
      message: 'استخدام علامتي التنصيص العربيتين «...» بدلاً من الأقواس اللاتينية',
      original: match[0],
      replacement: `«${match[1]}»`,
      index: match.index,
    });
  }

  // Check for Latin comma in Arabic text
  const latinCommaRegex = /([\p{Script=Arabic}])\s*,\s*([\p{Script=Arabic}])/gu;
  while ((match = latinCommaRegex.exec(text)) !== null) {
    suggestions.push({
      type: 'typography',
      message: 'استبدال الفاصلة اللاتينية (,) بالفاصلة العربية (،)',
      original: match[0],
      replacement: `${match[1]}، ${match[2]}`,
      index: match.index,
    });
  }

  return suggestions;
}
