import { LANGUAGES, type Language } from '../i18n/languages.ts';
import { loadConfig, isLangEnabled } from '../config.ts';

export function enabledLanguages(): Language[] {
  const cfg = loadConfig();
  return LANGUAGES.filter((l) => isLangEnabled(cfg, l.code));
}

export function enabledOrAll(): Set<string> {
  return new Set(enabledLanguages().map((l) => l.code));
}

/**
 * Language for a visitor with no prefix in the URL: the language they chose before, otherwise Arabic.
 * The site is Arabic-first by design, so the browser's Accept-Language is deliberately NOT used to switch language
 * (visitors pick another one from the language menu, and that choice is remembered in a cookie).
 */
export function negotiate(cookie: string | undefined, _acceptLanguage?: string | null): string {
  const langs = enabledLanguages();
  if (cookie && langs.some((l) => l.code === cookie)) return cookie;
  return loadConfig().defaultLang;
}
