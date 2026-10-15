import { LANGUAGES, negotiateLanguage, type Language } from '../i18n/languages.ts';
import { loadConfig, isLangEnabled } from '../config.ts';

export function enabledLanguages(): Language[] {
  const cfg = loadConfig();
  return LANGUAGES.filter((l) => isLangEnabled(cfg, l.code));
}

export function enabledOrAll(): Set<string> {
  return new Set(enabledLanguages().map((l) => l.code));
}

/** Language for a visitor with no prefix in the URL: saved choice → Accept-Language → Arabic. */
export function negotiate(cookie: string | undefined, acceptLanguage: string | null): string {
  const langs = enabledLanguages();
  if (cookie && langs.some((l) => l.code === cookie)) return cookie;
  return negotiateLanguage(acceptLanguage ?? undefined, langs, loadConfig().defaultLang);
}
