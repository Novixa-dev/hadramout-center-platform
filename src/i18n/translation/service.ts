import type { Config } from '../../config.ts';
import type { Store, Param } from '../../db/store.ts';
import { getPost } from '../../db/posts.ts';
import { TRANSLATABLE_FIELD_KEYS, type Post, type TrState } from '../../db/model.ts';
import { indexPost } from '../../db/search.ts';
import { getSite, DEFAULT_SITE } from '../../db/settings.ts';
import { sanitizeBody, sanitizeText, excerptFrom } from '../../lib/sanitize.ts';
import { getLanguage } from '../languages.ts';
import type { Messages } from '../messages.ts';
import { batchBlocks, hashText, maskPlaceholders, relevantGlossary, sameStructure, splitHtmlBlocks, unmaskPlaceholders } from './blocks.ts';
import { TranslationError, type GlossaryEntry, type TranslationProvider } from './types.ts';

export type Scope = 'post' | 'page' | 'author' | 'setting' | 'timeline' | 'term' | 'ui';

interface SourceField {
  text: string;
  format: 'text' | 'html';
}

interface StoredTranslation {
  field: string;
  text: string;
  source_hash: string;
  quality: 'auto' | 'reviewed' | 'manual';
}

interface JobRow {
  id: number;
  scope: Scope;
  ref: string;
  lang: string;
  attempts: number;
}

export interface JobCounts {
  queued: number;
  running: number;
  failed: number;
  done: number;
}

export type RequestResult = { accepted: true; state: 'queued' | 'running' } | { accepted: false; reason: 'no-provider' | 'language-disabled' | 'source-language' | 'unknown-language' };

const MAX_ATTEMPTS = 5;
const nowIso = () => new Date().toISOString();

export class TranslationService {
  private readonly config: Config;
  private readonly db: Store;
  private readonly messages: Messages;
  private provider: TranslationProvider | null;
  private timer: NodeJS.Timeout | null = null;
  private running = 0;
  private stopped = true;
  /** called whenever translated content changed (page cache invalidation) */
  onChange: () => void = () => {};

  constructor(deps: { config: Config; db: Store; messages: Messages; provider: TranslationProvider | null }) {
    this.config = deps.config;
    this.db = deps.db;
    this.messages = deps.messages;
    this.provider = deps.provider;
  }

  get enabled(): boolean {
    return this.provider !== null;
  }

  get providerName(): string {
    return this.provider?.name ?? 'none';
  }

  setProvider(provider: TranslationProvider | null): void {
    this.provider = provider;
  }

  // ── Language policy ────────────────────────────────────────────────────────

  isTranslatable(lang: string): boolean {
    if (lang === 'ar' || !getLanguage(lang)) return false;
    const enabled = this.config.enabledLangs;
    return enabled === '*' || enabled.includes(lang);
  }

  // ── Render path: reading translations ─────────────────────────────────────

  private stored(scope: Scope, refs: string[], lang: string): Map<string, Map<string, StoredTranslation>> {
    const out = new Map<string, Map<string, StoredTranslation>>();
    if (refs.length === 0) return out;
    const rows = this.db.all<StoredTranslation & { ref: string }>(
      `SELECT ref, field, text, source_hash, quality FROM translations WHERE scope = ? AND lang = ? AND ref IN (${refs.map(() => '?').join(',')})`,
      scope,
      lang,
      ...refs,
    );
    for (const r of rows) {
      const m = out.get(r.ref) ?? new Map<string, StoredTranslation>();
      m.set(r.field, r);
      out.set(r.ref, m);
    }
    return out;
  }

  private pendingRefs(scope: Scope, refs: string[], lang: string): Set<string> {
    if (refs.length === 0) return new Set();
    return new Set(
      this.db
        .all<{ ref: string }>(`SELECT ref FROM translation_jobs WHERE scope = ? AND lang = ? AND state IN ('queued','running') AND ref IN (${refs.map(() => '?').join(',')})`, scope, lang, ...refs)
        .map((r) => r.ref),
    );
  }

  /** Return copies of `posts` with text fields in `lang` where available; each carries `tr`. */
  localizePosts(posts: Post[], lang: string): Post[] {
    if (lang === 'ar') return posts.map((p) => ({ ...p, tr: sourceState() }));
    const ids = posts.map((p) => String(p.id));
    const tr = this.stored('post', ids, lang);
    const authorIds = [...new Set(posts.flatMap((p) => p.authors.map((a) => String(a.id))))];
    const authorTr = this.stored('author', authorIds, lang);
    const pending = this.pendingRefs('post', ids, lang);

    return posts.map((p) => {
      const m = tr.get(String(p.id));
      const get = (field: string) => m?.get(field)?.text;
      const title = get('title');
      const excerpt = get('excerpt');
      const body = p.body ? get('body') : undefined;
      const fields: Record<string, string> = { ...p.fields };
      for (const key of Object.keys(p.fields)) {
        const t = get(`f.${key}`);
        if (t) fields[key] = t;
      }
      const hasBody = p.body.length > 0;
      const complete = Boolean(title) && (!hasBody || Boolean(body));
      const any = Boolean(title || excerpt || body);
      const qualities = m ? [...m.values()].map((v) => v.quality) : [];
      const copy: Post = {
        ...p,
        title: title ?? p.title,
        excerpt: excerpt ?? (body ? excerptFrom(body, 220) : p.excerpt),
        body: body ?? p.body,
        fields,
        authors: p.authors.map((a) => ({ id: a.id, name: authorTr.get(String(a.id))?.get('name')?.text ?? a.name })),
        tr: {
          lang,
          status: complete ? 'complete' : any ? 'partial' : 'missing',
          titleLang: title ? lang : 'ar',
          excerptLang: excerpt || body ? lang : 'ar',
          bodyLang: body ? lang : 'ar',
          machine: qualities.some((q) => q === 'auto'),
          reviewed: qualities.length > 0 && qualities.every((q) => q !== 'auto'),
          pending: pending.has(String(p.id)),
        },
      };
      return copy;
    });
  }

  localizePost(post: Post, lang: string): Post {
    return this.localizePosts([post], lang)[0] as Post;
  }

  /** Translate one standalone text (page title, setting…). Falls back to the source. */
  localizeText(scope: Scope, ref: string, field: string, source: string, lang: string): { text: string; lang: string } {
    if (lang === 'ar' || !source) return { text: source, lang: 'ar' };
    const t = this.stored(scope, [ref], lang).get(ref)?.get(field);
    return t ? { text: t.text, lang } : { text: source, lang: 'ar' };
  }

  /** Site settings (name, tagline, address…) in the visitor's language. */
  localizeSite(lang: string) {
    const site = getSite(this.db);
    if (lang === 'ar') return { site, langOf: () => 'ar' };
    const m = this.stored('setting', ['site'], lang).get('site');
    const out = { ...site };
    const shown = new Map<string, string>();
    for (const key of ['name', 'shortName', 'tagline', 'description', 'address'] as const) {
      const t = m?.get(key)?.text;
      if (t) {
        out[key] = t;
        shown.set(key, lang);
      }
    }
    return { site: out, langOf: (key: string) => shown.get(key) ?? 'ar' };
  }

  // ── Queue ──────────────────────────────────────────────────────────────────

  request(scope: Scope, ref: string, lang: string, priority = 5): RequestResult {
    if (lang === 'ar') return { accepted: false, reason: 'source-language' };
    if (!getLanguage(lang)) return { accepted: false, reason: 'unknown-language' };
    if (!this.isTranslatable(lang)) return { accepted: false, reason: 'language-disabled' };
    if (!this.provider) return { accepted: false, reason: 'no-provider' };
    this.db.run(
      `INSERT INTO translation_jobs (scope, ref, lang, priority, state, run_after) VALUES (?, ?, ?, ?, 'queued', ?)
       ON CONFLICT(scope, ref, lang) DO UPDATE SET
         state = CASE WHEN translation_jobs.state = 'running' THEN 'running' ELSE 'queued' END,
         priority = MIN(translation_jobs.priority, excluded.priority),
         attempts = CASE WHEN translation_jobs.state IN ('done','failed') THEN 0 ELSE translation_jobs.attempts END,
         run_after = CASE WHEN translation_jobs.state = 'running' THEN translation_jobs.run_after ELSE excluded.run_after END,
         last_error = NULL, updated_at = ?`,
      scope,
      ref,
      lang,
      priority,
      nowIso(),
      nowIso(),
    );
    const state = this.db.get<{ state: 'queued' | 'running' }>('SELECT state FROM translation_jobs WHERE scope = ? AND ref = ? AND lang = ?', scope, ref, lang)?.state ?? 'queued';
    return { accepted: true, state };
  }

  /** Queue a post for the eager languages (on publish) and for every language it was already translated into (on edit). */
  enqueuePost(postId: number, opts: { includeExisting?: boolean } = {}): void {
    if (!this.provider) return;
    const langs = new Set(this.config.translation.eagerLangs);
    if (opts.includeExisting) {
      for (const r of this.db.all<{ lang: string }>("SELECT DISTINCT lang FROM translations WHERE scope = 'post' AND ref = ?", String(postId))) langs.add(r.lang);
    }
    for (const lang of langs) if (this.isTranslatable(lang)) this.request('post', String(postId), lang, 3);
  }

  status(scope: Scope, ref: string, lang: string): 'ready' | 'queued' | 'running' | 'failed' | 'none' {
    const job = this.db.get<{ state: string }>('SELECT state FROM translation_jobs WHERE scope = ? AND ref = ? AND lang = ?', scope, ref, lang);
    if (job?.state === 'queued' || job?.state === 'running' || job?.state === 'failed') return job.state;
    const has = this.db.get('SELECT 1 FROM translations WHERE scope = ? AND ref = ? AND lang = ? LIMIT 1', scope, ref, lang);
    return has ? 'ready' : 'none';
  }

  jobCounts(): JobCounts {
    const out: JobCounts = { queued: 0, running: 0, failed: 0, done: 0 };
    for (const r of this.db.all<{ state: keyof JobCounts; n: number }>('SELECT state, count(*) n FROM translation_jobs GROUP BY state')) out[r.state] = r.n;
    return out;
  }

  // ── Budget ─────────────────────────────────────────────────────────────────

  usageToday(): { charsIn: number; charsOut: number; calls: number; limit: number } {
    const day = nowIso().slice(0, 10);
    const row = this.db.get<{ ci: number | null; co: number | null; c: number | null }>('SELECT SUM(chars_in) ci, SUM(chars_out) co, SUM(calls) c FROM translation_usage WHERE day = ?', day);
    return { charsIn: row?.ci ?? 0, charsOut: row?.co ?? 0, calls: row?.c ?? 0, limit: this.config.translation.dailyCharLimit };
  }

  private recordUsage(provider: string, charsIn: number, charsOut: number): void {
    this.db.run(
      `INSERT INTO translation_usage (day, provider, chars_in, chars_out, calls) VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(day, provider) DO UPDATE SET chars_in = chars_in + excluded.chars_in, chars_out = chars_out + excluded.chars_out, calls = calls + 1`,
      nowIso().slice(0, 10),
      provider,
      charsIn,
      charsOut,
    );
  }

  private assertBudget(chars: number): void {
    const { charsIn, limit } = this.usageToday();
    if (limit > 0 && charsIn + chars > limit) throw new TranslationError('daily translation limit reached', true);
  }

  // ── Source extraction ─────────────────────────────────────────────────────

  private sourceFor(scope: Scope, ref: string): Record<string, SourceField> | null {
    switch (scope) {
      case 'post': {
        const post = getPost(this.db, Number(ref), { status: 'any' });
        if (!post) return null;
        const out: Record<string, SourceField> = { title: { text: post.title, format: 'text' } };
        if (post.excerpt) out.excerpt = { text: post.excerpt, format: 'text' };
        if (post.body) out.body = { text: post.body, format: 'html' };
        for (const key of TRANSLATABLE_FIELD_KEYS) {
          const v = post.fields[key];
          if (v) out[`f.${key}`] = { text: v, format: 'text' };
        }
        return out;
      }
      case 'page': {
        const row = this.db.get<{ title: string; body: string }>('SELECT title, body FROM pages WHERE slug = ?', ref);
        if (!row) return null;
        return { title: { text: row.title, format: 'text' }, ...(row.body ? { body: { text: row.body, format: 'html' as const } } : {}) };
      }
      case 'timeline': {
        const row = this.db.get<{ title: string; body: string; era: string }>('SELECT title, body, era FROM timeline_events WHERE id = ?', Number(ref));
        if (!row) return null;
        const out: Record<string, SourceField> = { title: { text: row.title, format: 'text' } };
        if (row.body) out.body = { text: row.body, format: 'text' };
        if (row.era) out.era = { text: row.era, format: 'text' };
        return out;
      }
      case 'setting': {
        if (ref !== 'site') return null;
        const site = getSite(this.db);
        const out: Record<string, SourceField> = {};
        for (const key of ['name', 'shortName', 'tagline', 'description', 'address'] as const) {
          const v = site[key] || DEFAULT_SITE[key];
          if (v) out[key] = { text: v, format: 'text' };
        }
        return out;
      }
      default:
        return null;
    }
  }

  private glossaryFor(lang: string): GlossaryEntry[] {
    const rows = this.db.all<{ term_ar: string; translation: string; kind: GlossaryEntry['kind']; lang: string }>(
      "SELECT term_ar, translation, kind, lang FROM glossary WHERE lang IN ('*', 'en', ?)",
      lang,
    );
    // language-specific entries override the English canonical spelling used as a Latin hint
    const map = new Map<string, GlossaryEntry>();
    for (const r of rows.sort((a, b) => rank(a.lang) - rank(b.lang))) map.set(r.term_ar, { termAr: r.term_ar, translation: r.translation, kind: r.kind });
    return [...map.values()];
  }

  // ── Translating ────────────────────────────────────────────────────────────

  private save(scope: Scope, ref: string, field: string, lang: string, text: string, hash: string, provider: TranslationProvider): void {
    this.db.run(
      `INSERT INTO translations (scope, ref, field, lang, text, source_hash, quality, provider, model) VALUES (?, ?, ?, ?, ?, ?, 'auto', ?, ?)
       ON CONFLICT(scope, ref, field, lang) DO UPDATE SET text = excluded.text, source_hash = excluded.source_hash, quality = 'auto',
         provider = excluded.provider, model = excluded.model, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      scope,
      ref,
      field,
      lang,
      text,
      hash,
      provider.name,
      provider.model,
    );
  }

  private async callProvider(
    provider: TranslationProvider,
    lang: string,
    texts: string[],
    format: 'text' | 'html',
    glossary: GlossaryEntry[],
    context: string,
  ): Promise<string[]> {
    const toName = getLanguage(lang)?.english ?? lang;
    const chars = texts.join('').length;
    this.assertBudget(chars);
    try {
      const result = await provider.translate({ texts, format, to: lang, toName, glossary: relevantGlossary(glossary, texts.join('\n')), context });
      this.recordUsage(provider.name, result.usage.charsIn, result.usage.charsOut);
      return result.texts;
    } catch (err) {
      // A truncated or mismatched batch is retried as two smaller halves.
      if (err instanceof TranslationError && texts.length > 1 && /truncated|marker/.test(err.message)) {
        const mid = Math.ceil(texts.length / 2);
        const left = await this.callProvider(provider, lang, texts.slice(0, mid), format, glossary, context);
        const right = await this.callProvider(provider, lang, texts.slice(mid), format, glossary, context);
        return [...left, ...right];
      }
      throw err;
    }
  }

  private async translateHtml(provider: TranslationProvider, lang: string, html: string, glossary: GlossaryEntry[], context: string): Promise<string> {
    const blocks = splitHtmlBlocks(html);
    const out: string[] = [];
    for (const batch of batchBlocks(blocks)) {
      let translated = await this.callProvider(provider, lang, batch, 'html', glossary, context);
      // Structure guard: retry any block whose tags changed once, individually.
      for (let i = 0; i < batch.length; i++) {
        if (!sameStructure(batch[i] as string, translated[i] as string)) {
          const retry = await this.callProvider(provider, lang, [batch[i] as string], 'html', glossary, context);
          if (!sameStructure(batch[i] as string, retry[0] as string)) throw new TranslationError('translated HTML changed the tag structure', true);
          translated = translated.map((t, j) => (j === i ? (retry[0] as string) : t));
        }
      }
      out.push(...translated);
    }
    return sanitizeBody(out.join(''));
  }

  /** Translate whatever is missing or out of date for one entity into one language. Returns fields written. */
  async translateEntity(scope: Scope, ref: string, lang: string, opts: { force?: boolean } = {}): Promise<number> {
    const provider = this.provider;
    if (!provider) throw new TranslationError('no translation provider configured', false);
    if (!this.isTranslatable(lang)) throw new TranslationError(`language "${lang}" is not enabled`, false);
    const source = this.sourceFor(scope, ref);
    if (!source) return 0;

    const existing = this.stored(scope, [ref], lang).get(ref) ?? new Map<string, StoredTranslation>();
    const todo = Object.entries(source).filter(([field, s]) => {
      const prev = existing.get(field);
      if (!prev) return true;
      if (prev.quality !== 'auto' && !opts.force) return false; // humans win
      return opts.force || prev.source_hash !== hashText(s.text);
    });
    if (todo.length === 0 && scope !== 'post') return 0;

    const glossary = this.glossaryFor(lang);
    const context = scope === 'post' ? 'a scholarly historical article, news item, book description or event announcement' : 'website text';
    let written = 0;

    // 1) short plain-text fields in one request
    const plain = todo.filter(([, s]) => s.format === 'text');
    if (plain.length) {
      const translated = await this.callProvider(provider, lang, plain.map(([, s]) => s.text), 'text', glossary, context);
      this.db.tx(() => {
        plain.forEach(([field, s], i) => {
          this.save(scope, ref, field, lang, sanitizeText(translated[i] as string), hashText(s.text), provider);
          written++;
        });
      });
    }
    // 2) HTML fields block by block
    for (const [field, s] of todo.filter(([, f]) => f.format === 'html')) {
      const html = await this.translateHtml(provider, lang, s.text, glossary, context);
      this.db.tx(() => this.save(scope, ref, field, lang, html, hashText(s.text), provider));
      written++;
    }
    // 3) author names for posts (transliteration), reused across all their posts
    if (scope === 'post') written += await this.translateAuthorsOf(Number(ref), lang, provider, glossary);

    if (scope === 'post') indexPost(this.db, Number(ref));
    this.onChange();
    return written;
  }

  private async translateAuthorsOf(postId: number, lang: string, provider: TranslationProvider, glossary: GlossaryEntry[]): Promise<number> {
    const authors = this.db.all<{ id: number; name: string }>('SELECT a.id, a.name FROM post_authors pa JOIN authors a ON a.id = pa.author_id WHERE pa.post_id = ?', postId);
    const have = this.stored('author', authors.map((a) => String(a.id)), lang);
    const missing = authors.filter((a) => !have.get(String(a.id))?.get('name'));
    if (missing.length === 0) return 0;
    const translated = await this.callProvider(provider, lang, missing.map((a) => a.name), 'text', glossary, 'names of authors and scholars (transliterate)');
    this.db.tx(() =>
      missing.forEach((a, i) => this.save('author', String(a.id), 'name', lang, sanitizeText(translated[i] as string), hashText(a.name), provider)),
    );
    return missing.length;
  }

  /** Translate (or refresh) the UI string bundle for a language. */
  async translateUi(lang: string): Promise<number> {
    const provider = this.provider;
    if (!provider) throw new TranslationError('no translation provider configured', false);
    if (!this.isTranslatable(lang)) throw new TranslationError(`language "${lang}" is not enabled`, false);
    const source = this.messages.source;
    const have = new Map(this.db.all<{ ref: string; source_hash: string }>("SELECT ref, source_hash FROM translations WHERE scope = 'ui' AND lang = ? AND field = 'text'", lang).map((r) => [r.ref, r.source_hash]));
    const curated = this.messages.missingKeys(lang);
    const todo = Object.keys(source).filter((k) => !have.has(k) || have.get(k) !== hashText(source[k] as string));
    // keys already provided by a hand-written pack are skipped
    const needed = todo.filter((k) => curated.includes(k) || have.has(k));
    if (needed.length === 0) return 0;
    const glossary = this.glossaryFor(lang);
    let written = 0;
    for (let i = 0; i < needed.length; i += 40) {
      const keys = needed.slice(i, i + 40);
      const masked = keys.map((k) => maskPlaceholders(source[k] as string));
      const out = await this.callProvider(provider, lang, masked.map((m) => m.masked), 'text', glossary, 'short website interface labels, buttons and messages');
      this.db.tx(() =>
        keys.forEach((k, j) => {
          const restored = unmaskPlaceholders(sanitizeText(out[j] as string), (masked[j] as { tokens: string[] }).tokens);
          this.save('ui', k, 'text', lang, restored, hashText(source[k] as string), provider);
          written++;
        }),
      );
    }
    this.messages.bump();
    this.onChange();
    return written;
  }

  /** Remove machine translations (keeps manual/reviewed ones) so they regenerate on demand. */
  clear(scope: Scope, ref: string, lang?: string): number {
    const params: Param[] = [scope, ref];
    let sql = "DELETE FROM translations WHERE scope = ? AND ref = ? AND quality = 'auto'";
    if (lang) {
      sql += ' AND lang = ?';
      params.push(lang);
    }
    return this.db.run(sql, ...params).changes;
  }

  /** Human edit: stored as 'manual' and never overwritten by machine translation. */
  saveManual(scope: Scope, ref: string, field: string, lang: string, text: string): void {
    const source = this.sourceFor(scope, ref)?.[field];
    const clean = source?.format === 'html' ? sanitizeBody(text) : sanitizeText(text);
    this.db.run(
      `INSERT INTO translations (scope, ref, field, lang, text, source_hash, quality, provider, model) VALUES (?, ?, ?, ?, ?, ?, 'manual', 'human', NULL)
       ON CONFLICT(scope, ref, field, lang) DO UPDATE SET text = excluded.text, source_hash = excluded.source_hash, quality = 'manual',
         provider = 'human', model = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      scope,
      ref,
      field,
      lang,
      clean,
      hashText(source?.text ?? ''),
    );
    if (scope === 'post') indexPost(this.db, Number(ref));
    this.onChange();
  }

  markReviewed(scope: Scope, ref: string, lang: string): void {
    this.db.run("UPDATE translations SET quality = 'reviewed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE scope = ? AND ref = ? AND lang = ? AND quality = 'auto'", scope, ref, lang);
    this.onChange();
  }

  // ── Worker ─────────────────────────────────────────────────────────────────

  private claim(): JobRow | undefined {
    return this.db.get<JobRow>(
      `UPDATE translation_jobs SET state = 'running', attempts = attempts + 1, updated_at = ?
       WHERE id = (SELECT id FROM translation_jobs WHERE state = 'queued' AND run_after <= ? ORDER BY priority, id LIMIT 1)
       RETURNING id, scope, ref, lang, attempts`,
      nowIso(),
      nowIso(),
    );
  }

  private async execute(job: JobRow): Promise<void> {
    try {
      if (job.scope === 'ui') await this.translateUi(job.lang);
      else await this.translateEntity(job.scope, job.ref, job.lang);
      this.db.run("UPDATE translation_jobs SET state = 'done', last_error = NULL, updated_at = ? WHERE id = ?", nowIso(), job.id);
    } catch (err) {
      const e = err as Error;
      const retryable = !(err instanceof TranslationError) || err.retryable;
      const capped = /daily translation limit/.test(e.message);
      if (retryable && (job.attempts < MAX_ATTEMPTS || capped)) {
        const delaySec = capped ? secondsUntilNextUtcDay() : 30 * 2 ** (job.attempts - 1);
        this.db.run("UPDATE translation_jobs SET state = 'queued', run_after = ?, last_error = ?, updated_at = ? WHERE id = ?", new Date(Date.now() + delaySec * 1000).toISOString(), e.message.slice(0, 500), nowIso(), job.id);
      } else {
        this.db.run("UPDATE translation_jobs SET state = 'failed', last_error = ?, updated_at = ? WHERE id = ?", e.message.slice(0, 500), nowIso(), job.id);
      }
    }
  }

  /** Process at most one queued job. Returns false when the queue is empty. Used by the loop and by tests. */
  async runOnce(): Promise<boolean> {
    if (!this.provider) return false;
    const job = this.claim();
    if (!job) return false;
    await this.execute(job);
    return true;
  }

  start(intervalMs = 1500): void {
    if (!this.stopped) return;
    this.stopped = false;
    // crash recovery: anything left "running" by a previous process goes back to the queue
    this.db.run("UPDATE translation_jobs SET state = 'queued' WHERE state = 'running'");
    this.timer = setInterval(() => void this.tick(), intervalMs);
    this.timer.unref();
  }

  private async tick(): Promise<void> {
    if (this.stopped || !this.provider) return;
    while (!this.stopped && this.running < this.config.translation.concurrency) {
      const job = this.claim();
      if (!job) return;
      this.running++;
      void this.execute(job).finally(() => {
        this.running--;
      });
    }
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const deadline = Date.now() + 10_000;
    while (this.running > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
  }

  /** housekeeping: drop finished jobs older than a week */
  prune(): void {
    this.db.run("DELETE FROM translation_jobs WHERE state = 'done' AND updated_at < ?", new Date(Date.now() - 7 * 86400_000).toISOString());
  }

  /** Coverage figures for the admin dashboard: how many published posts are fully translated per language. */
  coverageByLanguage(): { lang: string; posts: number; total: number }[] {
    const total = this.db.get<{ n: number }>("SELECT count(*) n FROM posts WHERE status = 'published'")?.n ?? 0;
    return this.db
      .all<{ lang: string; n: number }>("SELECT lang, count(DISTINCT ref) n FROM translations WHERE scope = 'post' AND field = 'title' GROUP BY lang ORDER BY n DESC")
      .map((r) => ({ lang: r.lang, posts: r.n, total }));
  }
}

function sourceState(): TrState {
  return { lang: 'ar', status: 'source', titleLang: 'ar', excerptLang: 'ar', bodyLang: 'ar', machine: false, reviewed: false, pending: false };
}

function rank(lang: string): number {
  return lang === '*' ? 0 : lang === 'en' ? 1 : 2;
}

function secondsUntilNextUtcDay(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 5, 0);
  return Math.max(60, Math.ceil((next - now.getTime()) / 1000));
}
