import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Store } from '../db/store.ts';

export type MessageDict = Record<string, string>;
export type Params = Record<string, string | number>;
export type Translate = (key: string, params?: Params) => string;

const UI_SCOPE = 'ui';

/**
 * UI string resolution.
 *   locales/ar.json     — source of truth (hand-written Arabic)
 *   locales/en.json     — hand-written English
 *   locales/<code>.json — optional hand-written packs for other languages
 *   translations table  — machine-translated UI strings (scope = 'ui') for every other language
 * Lookup order for a language L: L → en → ar. A key is never missing at render time.
 */
export class Messages {
  private readonly files = new Map<string, MessageDict>();
  private readonly dbCache = new Map<string, { version: number; dict: MessageDict }>();
  private version = 0;
  private readonly db: Store | null;
  private readonly dir: string;

  constructor(localesDir: string, db: Store | null) {
    this.dir = localesDir;
    this.db = db;
    this.reloadFiles();
  }

  reloadFiles(): void {
    this.files.clear();
    if (!existsSync(this.dir)) return;
    for (const f of readdirSync(this.dir)) {
      if (!f.endsWith('.json')) continue;
      const code = f.slice(0, -5);
      this.files.set(code, JSON.parse(readFileSync(join(this.dir, f), 'utf8')) as MessageDict);
    }
  }

  /** Invalidate cached machine translations after the UI job updated the table. */
  bump(): void {
    this.version++;
  }

  get source(): MessageDict {
    return this.files.get('ar') ?? {};
  }

  keys(): string[] {
    return Object.keys(this.source);
  }

  private fromDb(lang: string): MessageDict {
    if (!this.db) return {};
    const cached = this.dbCache.get(lang);
    if (cached && cached.version === this.version) return cached.dict;
    const dict: MessageDict = {};
    for (const r of this.db.all<{ ref: string; text: string }>('SELECT ref, text FROM translations WHERE scope = ? AND lang = ? AND field = ?', UI_SCOPE, lang, 'text')) {
      dict[r.ref] = r.text;
    }
    this.dbCache.set(lang, { version: this.version, dict });
    return dict;
  }

  /** Fraction (0..1) of Arabic UI keys that have a real translation for `lang`. */
  coverage(lang: string): number {
    const keys = this.keys();
    if (keys.length === 0) return 1;
    if (lang === 'ar') return 1;
    const own = { ...this.fromDb(lang), ...(this.files.get(lang) ?? {}) };
    return keys.filter((k) => k in own).length / keys.length;
  }

  /** Keys of the Arabic source that `lang` still lacks (used by the UI translation job). */
  missingKeys(lang: string): string[] {
    const own = { ...this.fromDb(lang), ...(this.files.get(lang) ?? {}) };
    return this.keys().filter((k) => !(k in own));
  }

  translator(lang: string): Translate {
    const own = { ...this.fromDb(lang), ...(this.files.get(lang) ?? {}) };
    const en = this.files.get('en') ?? {};
    const ar = this.source;
    const rules = safePluralRules(lang);

    const lookup = (key: string): string | undefined => own[key] ?? en[key] ?? ar[key];

    return (key, params) => {
      let template: string | undefined;
      if (params && typeof params.count === 'number') {
        const cat = rules.select(params.count);
        template = lookup(`${key}.${cat}`) ?? lookup(`${key}.other`);
      }
      template ??= lookup(key);
      if (template === undefined) return key;
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
    };
  }
}

function safePluralRules(lang: string): Intl.PluralRules {
  try {
    return new Intl.PluralRules(lang === 'zh-tw' ? 'zh-TW' : lang);
  } catch {
    return new Intl.PluralRules('en');
  }
}
