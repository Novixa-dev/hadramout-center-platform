/**
 * Arabic-aware text utilities: normalization for search, author-name keys,
 * clitic stripping, and reading-time estimates.
 */

// Tashkeel (harakat), superscript alef, Quranic annotation marks, tatweel.
const cp = (...codes: number[]): string => String.fromCodePoint(...codes);
const span = (from: number, to: number): string => cp(from) + "-" + cp(to);
const DIACRITICS = new RegExp("[" + span(0x064b, 0x065f) + cp(0x0670) + span(0x06d6, 0x06ed) + cp(0x0640) + "]", "g");
// Bidi/format characters that should never affect matching.
const INVISIBLES = new RegExp("[" + span(0x200b, 0x200f) + span(0x202a, 0x202e) + span(0x2066, 0x2069) + cp(0xfeff) + "]", "g");
const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** Convert Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Latin 0-9. */
export function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN_INDIC.indexOf(d));
  });
}

/**
 * Normalize text for matching (Lucene-style Arabic normalization + digits):
 * strips diacritics/tatweel, unifies alef/yeh/teh-marbuta/keheh forms, lowercases Latin.
 */
export function normalizeArabic(text: string): string {
  return toLatinDigits(text.normalize('NFKC'))
    .replace(INVISIBLES, '')
    .replace(DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ی/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ک/g, 'ك')
    .toLowerCase();
}

const CLITICS = ['وبال', 'وكال', 'وفال', 'ولل', 'وال', 'بال', 'كال', 'فال', 'لل', 'ال'];

/** Strip a leading definite-article clitic ("والتاريخ" → "تاريخ"). Input must be normalized. */
export function stripClitics(token: string): string {
  for (const c of CLITICS) {
    if (token.length > c.length + 1 && token.startsWith(c)) return token.slice(c.length);
  }
  return token;
}

/** Split normalized text into word tokens (letters and digits across all scripts). */
export function tokenize(normalized: string): string[] {
  return normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Tokens plus their clitic-stripped variants (de-duplicated) — used to build the `stems` column. */
export function stemTokens(normalized: string): string[] {
  const out = new Set<string>();
  for (const t of tokenize(normalized)) {
    const s = stripClitics(t);
    if (s !== t) out.add(s);
  }
  return [...out];
}

/** Build a safe FTS5 MATCH expression from a user query. Returns '' when nothing searchable. */
export function toFtsQuery(query: string): string {
  const tokens = tokenize(normalizeArabic(query)).slice(0, 12);
  if (tokens.length === 0) return '';
  return tokens
    .map((t) => {
      const stem = stripClitics(t);
      const quoted = `"${t.replaceAll('"', '')}"`;
      if (stem !== t && stem.length > 1) return `(${quoted}* OR "${stem.replaceAll('"', '')}"*)`;
      return `${quoted}*`;
    })
    .join(' AND ');
}

const HONORIFIC_TOKENS = new Set(
  [
    'أ', 'ا', 'د', 'م', 'أد', 'اد', 'أ.د', 'ا.د', 'أ.د.', 'ا.د.', 'د.', 'أ.', 'ا.', 'م.', 'ا.م.د', 'أ.م.د',
    'الأستاذ', 'الاستاذ', 'الأستاذة', 'الاستاذة', 'الدكتور', 'الدكتورة', 'دكتور', 'دكتورة', 'الشيخ', 'شيخ', 'السيد', 'السيدة',
    'الحبيب', 'المهندس', 'المهندسة', 'الباحث', 'الباحثة', 'الأديب', 'الاديب', 'الشاعر', 'العلامة', 'الإمام', 'الامام',
    'المؤرخ', 'المؤرخة', 'فضيلة', 'سعادة', 'معالي', 'الأخ', 'الاخ', 'الإعلامي', 'الاعلامي', 'الكاتب', 'الكاتبة', 'البروفيسور',
  ].map((s) => normalizeArabic(s)),
);

/** Remove honorifics, parenthetical notes and prayer phrases from an Arabic person name. */
export function cleanPersonName(name: string): string {
  const cleaned = name
    .replace(/\([^)]*\)|\[[^\]]*\]|«[^»]*»/g, ' ')
    .replace(/(?:رحمه|يرحمه|رحمها|يرحمها|حفظه|حفظها|رضي)\s+الله(?:\s+تعالى)?/g, ' ')
    .replace(/[،,؛;:|]+/g, ' ')
    .replace(/\.(?=\S)/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = cleaned.split(' ');
  while (parts.length > 1 && HONORIFIC_TOKENS.has(normalizeArabic(parts[0] as string))) parts.shift();
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Stable key used to merge spellings of the same author:
 * no honorifics, normalized letters, "عبد الله" ≡ "عبدالله".
 */
export function authorKey(name: string): string {
  const cleaned = cleanPersonName(name);
  return normalizeArabic(cleaned)
    .replace(/(^|\s)عبد\s+(?=\S)/g, '$1عبد')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when a byline fragment holds only titles ("الشيخ", "أ.م.د"), so it belongs to the name that follows it. */
const isBareHonorific = (fragment: string): boolean => fragment.split(' ').every((t) => HONORIFIC_TOKENS.has(normalizeArabic(t)));

/** Split a byline into individual author names ("أ و ب" / "أ، ب" / "أ & ب"). A title before "/" stays with its name ("الشيخ / فلان"). */
export function splitAuthors(line: string): string[] {
  const fragments = line
    .split(/\s+(?:و|&|and)\s+(?=[^\s])|[،;؛/|]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  const out: string[] = [];
  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i] as string;
    const next = fragments[i + 1];
    if (next !== undefined && isBareHonorific(fragment)) fragments[i + 1] = `${fragment} ${next}`;
    else out.push(fragment);
  }
  return out;
}

export function wordCount(text: string): number {
  return tokenize(normalizeArabic(text)).length;
}

/** Estimated reading time in whole minutes (min 1). */
export function readingMinutes(plainText: string, lang: string): number {
  const wpm = lang === 'ar' ? 170 : 220;
  return Math.max(1, Math.round(wordCount(plainText) / wpm));
}
