import { messagesFor } from './ui-store.ts';

export type Params = Record<string, string | number>;
export type T = (key: string, params?: Params) => string;

function pluralRules(lang: string): Intl.PluralRules {
  try {
    return new Intl.PluralRules(lang === 'zh-tw' ? 'zh-TW' : lang);
  } catch {
    return new Intl.PluralRules('en');
  }
}

/** Translator for `lang` with the fallback chain lang → en → ar. Keys never render empty. */
export function makeT(lang: string): T {
  const dict = messagesFor(lang);
  const rules = pluralRules(lang);
  return (key, params) => {
    let template: string | undefined;
    if (params && typeof params.count === 'number') {
      template = dict[`${key}.${rules.select(params.count)}`] ?? dict[`${key}.other`];
    }
    template ??= dict[key];
    if (template === undefined) return key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
  };
}
