import { LANGUAGES } from './languages.ts';

/** Payload `localization.locales` derived from the single language catalog. */
export const PAYLOAD_LOCALES = LANGUAGES.map((l) => ({
  code: l.code,
  label: { ar: l.arabic, en: l.english } as Record<string, string>,
  rtl: l.dir === 'rtl',
}));

export const DEFAULT_LOCALE = 'ar';
