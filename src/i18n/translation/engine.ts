import type { Payload } from 'payload';
import { sanitizeBody, sanitizeText } from '../../lib/sanitize.ts';
import { getLanguage } from '../languages.ts';
import { batchBlocks, hashText, maskPlaceholders, relevantGlossary, sameStructure, splitHtmlBlocks, unmaskPlaceholders } from './blocks.ts';
import { contextFor, isGlobalSlug, TRANSLATABLE, type FieldSpec, type TranslatableSlug } from './registry.ts';
import { TranslationError, type GlossaryEntry, type TranslationProvider } from './types.ts';

/** Per-field bookkeeping stored in each document's `translationMeta` JSON: translationMeta[lang][field]. */
export interface FieldMeta {
  /** hash of the Arabic source this translation was made from */
  h: string;
  /** auto = machine, reviewed = machine + human approved, manual = written/edited by a human (never overwritten) */
  q: 'auto' | 'reviewed' | 'manual';
  p?: string;
  m?: string;
  at: string;
}
export type TranslationMeta = Record<string, Record<string, FieldMeta>>;

type Doc = Record<string, unknown> & { id?: number | string; translationMeta?: TranslationMeta | null };

export interface EngineOptions {
  payload: Payload;
  provider: TranslationProvider | null;
  isLanguageEnabled: (lang: string) => boolean;
  dailyCharLimit: number;
  /** called after translations changed (cache invalidation, search reindex) */
  onChange?: (slug: TranslatableSlug, id: number | string | null, lang: string) => Promise<void> | void;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const today = (): string => new Date().toISOString().slice(0, 10);

export class TranslationEngine {
  private readonly o: EngineOptions;

  constructor(options: EngineOptions) {
    this.o = options;
  }

  get enabled(): boolean {
    return this.o.provider !== null;
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  private async load(slug: TranslatableSlug, id: number | string | null, locale: string): Promise<Doc | null> {
    const { payload } = this.o;
    try {
      if (isGlobalSlug(slug)) {
        return (await payload.findGlobal({ slug: 'site', locale: locale as never, fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as Doc;
      }
      return (await payload.findByID({ collection: slug as never, id: id as number, locale: locale as never, fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as Doc;
    } catch {
      return null;
    }
  }

  private async glossaryFor(lang: string): Promise<GlossaryEntry[]> {
    const res = await this.o.payload.find({ collection: 'glossary', limit: 2000, depth: 0, overrideAccess: true, pagination: false, where: { lang: { in: ['*', 'en', lang] } } });
    const rank = (l: string) => (l === '*' ? 0 : l === 'en' ? 1 : 2);
    const map = new Map<string, GlossaryEntry>();
    for (const r of [...(res.docs as unknown as { termAr: string; translation: string; kind: GlossaryEntry['kind']; lang: string }[])].sort((a, b) => rank(a.lang) - rank(b.lang))) {
      map.set(r.termAr, { termAr: r.termAr, translation: r.translation, kind: r.kind });
    }
    return [...map.values()];
  }

  // ── Budget ─────────────────────────────────────────────────────────────────

  async usageToday(): Promise<{ charsIn: number; charsOut: number; calls: number; limit: number }> {
    const res = await this.o.payload.find({ collection: 'translation-usage', where: { day: { equals: today() } }, limit: 20, depth: 0, overrideAccess: true, pagination: false });
    const docs = res.docs as unknown as { charsIn: number; charsOut: number; calls: number }[];
    return {
      charsIn: docs.reduce((n, d) => n + (d.charsIn ?? 0), 0),
      charsOut: docs.reduce((n, d) => n + (d.charsOut ?? 0), 0),
      calls: docs.reduce((n, d) => n + (d.calls ?? 0), 0),
      limit: this.o.dailyCharLimit,
    };
  }

  private async record(provider: string, charsIn: number, charsOut: number): Promise<void> {
    const { payload } = this.o;
    const key = `${today()}:${provider}`;
    const found = await payload.find({ collection: 'translation-usage', where: { key: { equals: key } }, limit: 1, depth: 0, overrideAccess: true });
    const row = found.docs[0] as unknown as { id: number; charsIn: number; charsOut: number; calls: number } | undefined;
    if (row) {
      await payload.update({ collection: 'translation-usage', id: row.id, data: { charsIn: row.charsIn + charsIn, charsOut: row.charsOut + charsOut, calls: row.calls + 1 }, overrideAccess: true, depth: 0 });
    } else {
      await payload.create({ collection: 'translation-usage', data: { key, day: today(), provider, charsIn, charsOut, calls: 1 }, overrideAccess: true, depth: 0 });
    }
  }

  private async assertBudget(chars: number): Promise<void> {
    const { charsIn } = await this.usageToday();
    if (this.o.dailyCharLimit > 0 && charsIn + chars > this.o.dailyCharLimit) throw new TranslationError('daily translation limit reached', true);
  }

  // ── Provider calls ─────────────────────────────────────────────────────────

  private async call(lang: string, texts: string[], format: 'text' | 'html', glossary: GlossaryEntry[], context: string): Promise<string[]> {
    const provider = this.o.provider;
    if (!provider) throw new TranslationError('no translation provider configured', false);
    await this.assertBudget(texts.join('').length);
    try {
      const result = await provider.translate({ texts, format, to: lang, toName: getLanguage(lang)?.english ?? lang, glossary: relevantGlossary(glossary, texts.join('\n')), context });
      await this.record(provider.name, result.usage.charsIn, result.usage.charsOut);
      return result.texts;
    } catch (err) {
      // A truncated or mismatched batch is retried as two smaller halves.
      if (err instanceof TranslationError && texts.length > 1 && /truncated|marker/.test(err.message)) {
        const mid = Math.ceil(texts.length / 2);
        return [...(await this.call(lang, texts.slice(0, mid), format, glossary, context)), ...(await this.call(lang, texts.slice(mid), format, glossary, context))];
      }
      throw err;
    }
  }

  private async translateHtml(lang: string, html: string, glossary: GlossaryEntry[], context: string): Promise<string> {
    const out: string[] = [];
    for (const batch of batchBlocks(splitHtmlBlocks(html))) {
      let translated = await this.call(lang, batch, 'html', glossary, context);
      // Structure guard: any block whose tags changed is retried once on its own.
      for (let i = 0; i < batch.length; i++) {
        if (!sameStructure(batch[i] as string, translated[i] as string)) {
          const retry = await this.call(lang, [batch[i] as string], 'html', glossary, context);
          if (!sameStructure(batch[i] as string, retry[0] as string)) throw new TranslationError('translated HTML changed the tag structure', true);
          translated = translated.map((t, j) => (j === i ? (retry[0] as string) : t));
        }
      }
      out.push(...translated);
    }
    return sanitizeBody(out.join(''));
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Translate whatever is missing or out of date for one document into one language.
   * Human-written/edited fields are never overwritten (unless `force`). Returns the fields written.
   */
  async translateDoc(slug: TranslatableSlug, id: number | string | null, lang: string, opts: { force?: boolean } = {}): Promise<string[]> {
    const { payload, provider } = this.o;
    if (!provider) throw new TranslationError('no translation provider configured', false);
    if (lang === 'ar' || !getLanguage(lang) || !this.o.isLanguageEnabled(lang)) throw new TranslationError(`language "${lang}" is not enabled`, false);

    const source = await this.load(slug, id, 'ar');
    if (!source) return [];
    const current = (await this.load(slug, id, lang)) ?? {};
    const meta: TranslationMeta = { ...(source.translationMeta ?? {}) };
    const langMeta: Record<string, FieldMeta> = { ...(meta[lang] ?? {}) };

    const specs = TRANSLATABLE[slug];
    const todo: { spec: FieldSpec; text: string }[] = [];
    for (const spec of specs) {
      const text = str(source[spec.name]);
      if (!text.trim()) continue;
      const prev = langMeta[spec.name];
      const have = str(current[spec.name]).trim().length > 0;
      if (have && prev && prev.q !== 'auto' && !opts.force) continue; // humans win
      if (have && prev && prev.h === hashText(text) && !opts.force) continue; // already fresh
      if (have && !prev && !opts.force) {
        // translated by hand before metadata existed → treat as manual
        langMeta[spec.name] = { h: hashText(text), q: 'manual', at: new Date().toISOString() };
        continue;
      }
      todo.push({ spec, text });
    }
    if (todo.length === 0) {
      if (JSON.stringify(langMeta) !== JSON.stringify(meta[lang] ?? {})) await this.writeMeta(slug, id, { ...meta, [lang]: langMeta });
      return [];
    }

    const glossary = await this.glossaryFor(lang);
    const context = contextFor(slug);
    const data: Record<string, string> = {};

    const plain = todo.filter((t) => t.spec.format === 'text');
    if (plain.length) {
      const translated = await this.call(lang, plain.map((t) => t.text), 'text', glossary, context);
      plain.forEach((t, i) => {
        data[t.spec.name] = sanitizeText(translated[i] as string);
      });
    }
    for (const t of todo.filter((x) => x.spec.format === 'html')) data[t.spec.name] = await this.translateHtml(lang, t.text, glossary, context);

    const now = new Date().toISOString();
    for (const t of todo) langMeta[t.spec.name] = { h: hashText(t.text), q: 'auto', p: provider.name, m: provider.model, at: now };
    meta[lang] = langMeta;

    const req = { context: { fromTranslation: true, skipHooks: true } };
    if (isGlobalSlug(slug)) {
      await payload.updateGlobal({ slug: 'site', locale: lang as never, data: { ...data, translationMeta: meta } as never, overrideAccess: true, depth: 0, context: req.context });
    } else {
      await payload.update({ collection: slug as never, id: id as number, locale: lang as never, data: { ...data, translationMeta: meta } as never, overrideAccess: true, depth: 0, context: req.context });
    }
    await this.o.onChange?.(slug, id, lang);
    return Object.keys(data);
  }

  private async writeMeta(slug: TranslatableSlug, id: number | string | null, meta: TranslationMeta): Promise<void> {
    const { payload } = this.o;
    if (isGlobalSlug(slug)) {
      await payload.updateGlobal({ slug: 'site', data: { translationMeta: meta } as never, overrideAccess: true, depth: 0, context: { fromTranslation: true, skipHooks: true } });
    } else {
      await payload.update({ collection: slug as never, id: id as number, data: { translationMeta: meta } as never, overrideAccess: true, depth: 0, context: { fromTranslation: true, skipHooks: true } });
    }
  }

  /** Languages a document already has translations in (used to refresh them when the Arabic changes). */
  static existingLanguages(doc: { translationMeta?: TranslationMeta | null }): string[] {
    return Object.keys(doc.translationMeta ?? {});
  }

  /** Mark all machine translations of one language as human-approved. */
  async markReviewed(slug: TranslatableSlug, id: number | string | null, lang: string): Promise<void> {
    const source = await this.load(slug, id, 'ar');
    if (!source) return;
    const meta: TranslationMeta = { ...(source.translationMeta ?? {}) };
    const langMeta = { ...(meta[lang] ?? {}) };
    for (const [k, v] of Object.entries(langMeta)) if (v.q === 'auto') langMeta[k] = { ...v, q: 'reviewed' };
    await this.writeMeta(slug, id, { ...meta, [lang]: langMeta });
  }

  // ── UI strings ─────────────────────────────────────────────────────────────

  /**
   * Translate the UI string bundle (ar source) into `lang`. Pure function over dictionaries so the
   * caller decides where the result is stored (a JSON file per language).
   */
  async translateUi(lang: string, source: Record<string, string>, existing: Record<string, string>, existingHashes: Record<string, string>): Promise<{ strings: Record<string, string>; hashes: Record<string, string> }> {
    const provider = this.o.provider;
    if (!provider) throw new TranslationError('no translation provider configured', false);
    if (!this.o.isLanguageEnabled(lang)) throw new TranslationError(`language "${lang}" is not enabled`, false);
    const strings = { ...existing };
    const hashes = { ...existingHashes };
    const needed = Object.keys(source).filter((k) => !(k in existing) || existingHashes[k] !== hashText(source[k] as string));
    const glossary = await this.glossaryFor(lang);
    for (let i = 0; i < needed.length; i += 40) {
      const keys = needed.slice(i, i + 40);
      const masked = keys.map((k) => maskPlaceholders(source[k] as string));
      const out = await this.call(lang, masked.map((m) => m.masked), 'text', glossary, 'short website interface labels, buttons and messages');
      keys.forEach((k, j) => {
        strings[k] = unmaskPlaceholders(sanitizeText(out[j] as string), (masked[j] as { tokens: string[] }).tokens);
        hashes[k] = hashText(source[k] as string);
      });
    }
    return { strings, hashes };
  }
}
