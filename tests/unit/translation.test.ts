import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Store, migrate } from '../../src/db/store.ts';
import { loadConfig } from '../../src/config.ts';
import { Messages } from '../../src/i18n/messages.ts';
import { TranslationService } from '../../src/i18n/translation/service.ts';
import { MockProvider } from '../../src/i18n/translation/providers.ts';
import { AnthropicProvider, buildSystemPrompt, parseSegments } from '../../src/i18n/translation/anthropic.ts';
import { batchBlocks, hashText, maskPlaceholders, protectGlossary, sameStructure, splitHtmlBlocks, unmaskPlaceholders, unprotectGlossary } from '../../src/i18n/translation/blocks.ts';
import type { TranslationError } from '../../src/i18n/translation/types.ts';
import { createPost, getPost, updatePost } from '../../src/db/posts.ts';
import { seedDefaults } from '../../src/db/seed.ts';
import type { Post } from '../../src/db/model.ts';

const migrations = join(import.meta.dirname, '../../migrations');

function setup(env: Record<string, string> = {}) {
  const db = new Store(':memory:');
  migrate(db, migrations);
  seedDefaults(db);
  const config = loadConfig({ NODE_ENV: 'test', TRANSLATION_PROVIDER: 'mock', TRANSLATION_EAGER_LANGS: 'en', ...env } as NodeJS.ProcessEnv);
  const messages = new Messages(join(import.meta.dirname, '../fixtures/locales'), db);
  const provider = new MockProvider();
  const svc = new TranslationService({ config, db, messages, provider });
  return { db, svc, provider, messages, config };
}

const ARTICLE = {
  type: 'article' as const,
  status: 'published' as const,
  title: 'ميناء سمهرم',
  body: '<p>تقع سمهرم في ظفار.</p><h2>التجارة</h2><p>تاجر الحضارم باللبان.</p>',
  fields: { author: 'د. أحمد باحارثة' },
};

describe('html blocks', () => {
  test('splits top-level blocks and re-joins losslessly', () => {
    const html = '<p>a</p><h2>b</h2><ul><li>x</li></ul>';
    const blocks = splitHtmlBlocks(html);
    assert.deepEqual(blocks, ['<p>a</p>', '<h2>b</h2>', '<ul><li>x</li></ul>']);
    assert.equal(blocks.join(''), html);
  });
  test('batchBlocks respects the size limit but never splits a block', () => {
    const batches = batchBlocks(['a'.repeat(3000), 'b'.repeat(3000), 'c'.repeat(100)], 5500);
    assert.deepEqual(batches.map((b) => b.length), [1, 2]);
    assert.equal(batchBlocks(['x'.repeat(9000)], 5500).length, 1);
  });
  test('structure guard compares tags', () => {
    assert.ok(sameStructure('<p>a <b>b</b></p>', '<p>x <b>y</b></p>'));
    assert.ok(!sameStructure('<p>a</p>', '<p>a</p><p>b</p>'));
    assert.ok(!sameStructure('<p>a <b>b</b></p>', '<p>a b</p>'));
  });
  test('glossary protection and placeholders round-trip', () => {
    const g = [{ termAr: 'سمهرم', translation: 'Sumhuram', kind: 'place' as const }];
    const protectedHtml = protectGlossary('<p>ميناء سمهرم</p>', g);
    assert.match(protectedHtml, /translate="no"[^>]*>Sumhuram</);
    assert.equal(unprotectGlossary(protectedHtml), '<p>ميناء Sumhuram</p>');
    const { masked, tokens } = maskPlaceholders('عرض {count} من {total}');
    assert.equal(masked, 'عرض ⟦0⟧ من ⟦1⟧');
    assert.equal(unmaskPlaceholders('Showing ⟦ 0 ⟧ of ⟦1⟧', tokens), 'Showing {count} of {total}');
  });
});

describe('anthropic provider (fake client)', () => {
  test('parseSegments', () => {
    assert.deepEqual(parseSegments('@@@1@@@\nHello\n@@@2@@@\nWorld\n', 2), ['Hello', 'World']);
    assert.equal(parseSegments('@@@1@@@\nHello', 2), null);
    assert.equal(parseSegments('no markers', 1), null);
  });
  test('system prompt carries the glossary and target language', () => {
    const prompt = buildSystemPrompt({ texts: ['x'], format: 'html', to: 'fr', toName: 'French', glossary: [{ termAr: 'سمهرم', translation: 'Sumhuram', kind: 'place' }] });
    assert.match(prompt, /French/);
    assert.match(prompt, /سمهرم => Sumhuram/);
    assert.match(prompt, /HTML fragment/);
  });
  test('sends the expected request and parses the answer', async () => {
    let seen: Record<string, unknown> = {};
    const provider = new AnthropicProvider({
      apiKey: 'k',
      model: 'claude-opus-5-5',
      client: {
        create: async (params) => {
          seen = params;
          return { content: [{ type: 'text', text: '@@@1@@@\nPort of Sumhuram\n@@@2@@@\nTrade' }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 } };
        },
      },
    });
    const r = await provider.translate({ texts: ['ميناء سمهرم', 'التجارة'], format: 'text', to: 'en', toName: 'English', glossary: [] });
    assert.deepEqual(r.texts, ['Port of Sumhuram', 'Trade']);
    assert.equal(r.usage.tokensIn, 10);
    assert.equal(seen.model, 'claude-opus-5-5');
    assert.deepEqual(seen.output_config, { effort: 'low' });
    assert.equal(seen.fallbacks, 'default');
    assert.equal('temperature' in seen, false, 'sampling params are rejected by current models');
    assert.equal('thinking' in seen, false);
  });
  test('refusal and truncation are surfaced as non-retryable errors', async () => {
    const make = (stop: string) => new AnthropicProvider({ apiKey: 'k', model: 'claude-haiku-5-5', client: { create: async () => ({ content: [], stop_reason: stop }) } });
    const req = { texts: ['x'], format: 'text' as const, to: 'en', toName: 'English', glossary: [] };
    await assert.rejects(make('refusal').translate(req), (e: TranslationError) => !e.retryable);
    await assert.rejects(make('max_tokens').translate(req), /truncated/);
  });
});

const asPost = (p: Post | null): Post => p as Post;

describe('translation service', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
  });

  test('translateEntity stores fields, authors and updates the search index', async () => {
    const id = createPost(ctx.db, ARTICLE);
    const written = await ctx.svc.translateEntity('post', String(id), 'en');
    assert.ok(written >= 4, `written ${written}`);
    const post = ctx.svc.localizePost(asPost(getPost(ctx.db, id)), 'en');
    assert.match(post.title, /^⟦en⟧ ميناء سمهرم/);
    assert.match(post.body, /<p>⟦en⟧ تقع سمهرم/);
    assert.equal(post.tr?.status, 'complete');
    assert.equal(post.tr?.machine, true);
    assert.match(post.authors[0]?.name ?? '', /⟦en⟧/);
    assert.ok(ctx.db.get("SELECT 1 FROM search_index WHERE lang = 'en' AND post_id = ?", id), 'English row exists in the search index');
  });

  test('second call is a no-op (translation memory) and unchanged text is not re-sent', async () => {
    const id = createPost(ctx.db, ARTICLE);
    await ctx.svc.translateEntity('post', String(id), 'fr');
    const calls = ctx.provider.calls;
    assert.equal(await ctx.svc.translateEntity('post', String(id), 'fr'), 0);
    assert.equal(ctx.provider.calls, calls);
  });

  test('editing the Arabic source makes the translation stale and re-translates only the changed field', async () => {
    const id = createPost(ctx.db, ARTICLE);
    await ctx.svc.translateEntity('post', String(id), 'en');
    updatePost(ctx.db, id, { title: 'ميناء سمهرم الحضرمي' });
    const written = await ctx.svc.translateEntity('post', String(id), 'en');
    assert.equal(written, 1, 'only the title changed');
    assert.match(ctx.svc.localizePost(asPost(getPost(ctx.db, id)), 'en').title, /الحضرمي/);
  });

  test('manual translations are never overwritten by machine translation', async () => {
    const id = createPost(ctx.db, ARTICLE);
    await ctx.svc.translateEntity('post', String(id), 'en');
    ctx.svc.saveManual('post', String(id), 'title', 'en', 'Port of Sumhuram');
    updatePost(ctx.db, id, { title: 'تغيّر العنوان' });
    await ctx.svc.translateEntity('post', String(id), 'en');
    assert.equal(ctx.svc.localizePost(asPost(getPost(ctx.db, id)), 'en').title, 'Port of Sumhuram');
  });

  test('a provider that breaks the HTML structure is rejected', async () => {
    const id = createPost(ctx.db, ARTICLE);
    ctx.provider.translate = async (req) => ({ texts: req.texts.map((t) => (req.format === 'html' ? `${t}<p>extra</p>` : t)), usage: { charsIn: 1, charsOut: 1 } });
    await assert.rejects(ctx.svc.translateEntity('post', String(id), 'de'), /tag structure/);
  });

  test('queue: request → runOnce → ready; duplicates collapse; unknown/disabled languages are refused', async () => {
    const id = createPost(ctx.db, ARTICLE);
    assert.deepEqual(ctx.svc.request('post', String(id), 'ar'), { accepted: false, reason: 'source-language' });
    assert.deepEqual(ctx.svc.request('post', String(id), 'xx'), { accepted: false, reason: 'unknown-language' });
    assert.equal(ctx.svc.request('post', String(id), 'tr').accepted, true);
    ctx.svc.request('post', String(id), 'tr');
    assert.equal(ctx.db.get<{ n: number }>('SELECT count(*) n FROM translation_jobs')?.n, 1);
    assert.equal(ctx.svc.status('post', String(id), 'tr'), 'queued');
    assert.equal(await ctx.svc.runOnce(), true);
    assert.equal(ctx.svc.status('post', String(id), 'tr'), 'ready');
    assert.equal(await ctx.svc.runOnce(), false);
  });

  test('queue: retryable failures back off', async () => {
    const id = createPost(ctx.db, ARTICLE);
    ctx.svc.request('post', String(id), 'ur');
    ctx.provider.failNext = 1;
    await ctx.svc.runOnce();
    const job = ctx.db.get<{ state: string; attempts: number; run_after: string }>('SELECT state, attempts, run_after FROM translation_jobs');
    assert.equal(job?.state, 'queued');
    assert.equal(job?.attempts, 1);
    assert.ok((job?.run_after ?? '') > new Date().toISOString(), 'backoff pushes run_after into the future');
  });

  test('daily character cap stops translation and defers the job', async () => {
    const small = setup({ TRANSLATION_DAILY_CHAR_LIMIT: '20' });
    const id = createPost(small.db, ARTICLE);
    small.svc.request('post', String(id), 'es');
    await small.svc.runOnce();
    const job = small.db.get<{ state: string; last_error: string }>('SELECT state, last_error FROM translation_jobs');
    assert.equal(job?.state, 'queued');
    assert.match(job?.last_error ?? '', /daily translation limit/);
  });

  test('no provider: requests are refused and rendering falls back to Arabic', () => {
    const none = setup({ TRANSLATION_PROVIDER: 'none' });
    none.svc.setProvider(null);
    const id = createPost(none.db, ARTICLE);
    assert.deepEqual(none.svc.request('post', String(id), 'fr'), { accepted: false, reason: 'no-provider' });
    const p = none.svc.localizePost(asPost(getPost(none.db, id)), 'fr');
    assert.equal(p.title, ARTICLE.title);
    assert.equal(p.tr?.status, 'missing');
    assert.equal(p.tr?.titleLang, 'ar');
  });

  test('enqueuePost: eager languages on publish, existing languages on edit', async () => {
    const id = createPost(ctx.db, ARTICLE);
    ctx.svc.enqueuePost(id);
    assert.deepEqual(ctx.db.all<{ lang: string }>('SELECT lang FROM translation_jobs').map((j) => j.lang), ['en']);
    await ctx.svc.translateEntity('post', String(id), 'fr');
    ctx.svc.enqueuePost(id, { includeExisting: true });
    assert.deepEqual(ctx.db.all<{ lang: string }>('SELECT lang FROM translation_jobs ORDER BY lang').map((j) => j.lang), ['en', 'fr']);
  });

  test('UI strings: placeholders survive and coverage rises', async () => {
    const written = await ctx.svc.translateUi('fr');
    assert.ok(written > 0);
    const t = ctx.messages.translator('fr');
    assert.match(t('greeting', { name: 'Ali' }), /Ali/);
    assert.ok(ctx.messages.coverage('fr') > 0.99);
    assert.equal(await ctx.svc.translateUi('fr'), 0, 'nothing left to translate');
  });

  test('site settings are translatable', async () => {
    await ctx.svc.translateEntity('setting', 'site', 'en');
    const { site, langOf } = ctx.svc.localizeSite('en');
    assert.match(site.name, /^⟦en⟧/);
    assert.equal(langOf('name'), 'en');
  });

  test('hashText is stable', () => assert.equal(hashText('abc'), hashText('abc')));
});
