import { toLatinDigits } from './arabic.ts';

const MONTHS: Record<string, number> = {
  // Gregorian month names as used on the legacy site (alef-normalized spellings included)
  يناير: 1, فبراير: 2, مارس: 3, ابريل: 4, أبريل: 4, مايو: 5, يونيو: 6, يوليو: 7,
  اغسطس: 8, أغسطس: 8, سبتمبر: 9, اكتوبر: 10, أكتوبر: 10, نوفمبر: 11, ديسمبر: 12,
  // Levantine / Iraqi names
  'كانون الثاني': 1, شباط: 2, اذار: 3, آذار: 3, نيسان: 4, ايار: 5, أيار: 5, حزيران: 6, تموز: 7, اب: 8, آب: 8,
  ايلول: 9, أيلول: 9, 'تشرين الاول': 10, 'تشرين الأول': 10, 'تشرين الثاني': 11, 'كانون الاول': 12, 'كانون الأول': 12,
};

export interface ParsedDate {
  year?: number;
  month?: number;
  day?: number;
}

/** Parse "04 أكتوبر 2026" / "26 نوفمبر" / "٢٦ نوفمبر ٢٠٢٤". Returns whatever parts were found. */
export function parseArabicDate(input: string): ParsedDate {
  const text = toLatinDigits(input).replace(/\s+/g, ' ').trim();
  const result: ParsedDate = {};
  for (const [name, num] of Object.entries(MONTHS).sort((a, b) => b[0].length - a[0].length)) {
    if (text.includes(name)) {
      result.month = num;
      break;
    }
  }
  const nums = text.match(/\d+/g)?.map(Number) ?? [];
  for (const n of nums) {
    if (n >= 1900 && n <= 2100) result.year = n;
    else if (n >= 1 && n <= 31 && result.day === undefined) result.day = n;
  }
  return result;
}

/** ISO date (YYYY-MM-DD) from parsed parts, or null if incomplete. */
export function toIsoDate(p: ParsedDate): string | null {
  if (!p.year || !p.month || !p.day) return null;
  const mm = String(p.month).padStart(2, '0');
  const dd = String(p.day).padStart(2, '0');
  return `${p.year}-${mm}-${dd}`;
}

const LATIN_NU = '-u-nu-latn';

function safeLocale(lang: string, extension = ''): string {
  const tag = `${lang}${LATIN_NU}${extension}`;
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([tag]).length ? tag : `en${LATIN_NU}`;
  } catch {
    return `en${LATIN_NU}`;
  }
}

function toDate(iso: string): Date | null {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Long localized Gregorian date, e.g. "4 أكتوبر 2026" / "4 October 2026". */
export function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat(safeLocale(lang), { dateStyle: 'long', timeZone: 'UTC' }).format(d);
}

/** Hijri (Umm al-Qura) date in Arabic, e.g. "25 ربيع الآخر 1448 هـ". */
export function formatHijri(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
  } catch {
    return '';
  }
}

export function formatMonthYear(iso: string | null | undefined, lang: string): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat(safeLocale(lang), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function yearOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const y = Number.parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

export function monthShort(iso: string, lang: string): string {
  const d = toDate(iso);
  return d ? new Intl.DateTimeFormat(safeLocale(lang), { month: 'short', timeZone: 'UTC' }).format(d) : '';
}

export function dayOf(iso: string): string {
  return String(Number.parseInt(iso.slice(8, 10), 10) || '');
}
