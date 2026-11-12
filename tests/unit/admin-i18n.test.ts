import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ar as payloadAr } from '@payloadcms/translations/languages/ar';
import { en as payloadEn } from '@payloadcms/translations/languages/en';
import { ADMIN_STRING_TABLES, ADMIN_TRANSLATIONS, adminLang, fill, waitingLine } from '../../src/admin/i18n.ts';
import { listUrl } from '../../src/admin/links.ts';
import { registerHooks } from 'node:module';

// The collections import `next/cache` (revalidation hooks); Next resolves it, plain Node needs the file name.
registerHooks({ resolve: (spec, ctx, next) => next(spec === 'next/cache' ? 'next/cache.js' : spec, ctx) });
const { Users } = await import('../../src/collections/Users.ts');
const { Messages, Subscribers, TranslationUsage } = await import('../../src/collections/Forms.ts');
const { News, Articles, Books, Magazines, Events, ForumEvents, Videos } = await import('../../src/collections/content.ts');
const { Authors } = await import('../../src/collections/Authors.ts');
const { Categories } = await import('../../src/collections/Categories.ts');
const { Glossary } = await import('../../src/collections/Glossary.ts');
const { Reviews } = await import('../../src/collections/Reviews.ts');
const { Timeline } = await import('../../src/collections/Timeline.ts');
const { Pages } = await import('../../src/collections/Pages.ts');
const { Media } = await import('../../src/collections/Media.ts');
const { Audio } = await import('../../src/collections/Audio.ts');
const { Announcements } = await import('../../src/collections/Announcements.ts');
const { Partners } = await import('../../src/collections/Partners.ts');
const { Testimonials } = await import('../../src/collections/Testimonials.ts');
const { Site } = await import('../../src/globals/Site.ts');

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('admin interface strings', () => {
  for (const [name, table] of Object.entries(ADMIN_STRING_TABLES)) {
    test(`${name}: Arabic and English have the same keys, none empty, same placeholders`, () => {
      const t = table as unknown as Record<'ar' | 'en', Record<string, string>>;
      assert.deepEqual(Object.keys(t.en).sort(), Object.keys(t.ar).sort());
      for (const k of Object.keys(t.ar)) {
        assert.ok(t.ar[k]!.trim() && t.en[k]!.trim(), `${name}.${k} is empty`);
        assert.deepEqual(placeholders(t.en[k]!), placeholders(t.ar[k]!), `${name}.${k} placeholders differ`);
      }
    });
  }

  test('English strings contain no Arabic letters and vice versa where words are expected', () => {
    for (const table of Object.values(ADMIN_STRING_TABLES) as unknown as Record<'ar' | 'en', Record<string, string>>[]) {
      for (const [k, v] of Object.entries(table.en)) {
        // the language switch names the *other* language in its own script on purpose
        if (k === 'switchTo') continue;
        assert.doesNotMatch(v.replace(/\{\w+\}/g, ''), /[؀-ۿ]/, `en.${k} has Arabic text`);
      }
      assert.match(table.ar.switchTo ?? 'English', /^English$/);
    }
  });

  test('the overridden Payload phrases exist in Payload in both languages (a rename upstream would silently drop them)', () => {
    for (const [lang, own] of Object.entries(ADMIN_TRANSLATIONS)) {
      const upstream = (lang === 'ar' ? payloadAr : payloadEn).translations as unknown as Record<string, Record<string, string>>;
      for (const [group, keys] of Object.entries(own)) {
        for (const key of Object.keys(keys)) assert.equal(typeof upstream[group]?.[key], 'string', `${lang} ${group}:${key} is not a Payload key`);
      }
    }
  });

  test('fill and adminLang', () => {
    assert.equal(fill('{used} of {limit}', { used: 3, limit: '10' }), '3 of 10');
    assert.equal(fill('keep {missing}', {}), 'keep {missing}');
    assert.equal(adminLang('en'), 'en');
    assert.equal(adminLang('ar'), 'ar');
    assert.equal(adminLang(undefined), 'ar');
    assert.equal(adminLang('fr'), 'ar');
  });
});

describe('dashboard links', () => {
  test('filtered list URLs use the admin where[] syntax, values encoded', () => {
    assert.equal(listUrl('reviews', { status: { equals: 'pending' } }), '/admin/collections/reviews?where[status][equals]=pending');
    assert.equal(listUrl('articles'), '/admin/collections/articles');
    assert.equal(listUrl('messages', { kind: { equals: 'a b&c' } }), '/admin/collections/messages?where[kind][equals]=a%20b%26c');
  });
});

describe('collection labels', () => {
  const collections = [News, Articles, Books, Magazines, Events, ForumEvents, Videos, Audio, Announcements, Partners, Testimonials, Authors, Categories, Pages, Timeline, Media, Glossary, Reviews, Messages, Subscribers, TranslationUsage, Users];
  type Node = { name?: string; label?: unknown; fields?: Node[]; tabs?: Node[]; options?: unknown[]; admin?: { hidden?: boolean; description?: unknown } };
  const problems: string[] = [];
  const bilingual = (v: unknown, where: string) => {
    if (v === undefined || v === false) return;
    if (typeof v === 'string') return problems.push(`${where}: plain string label "${v}" (shows the same text in both languages)`);
    if (typeof v === 'object' && v) {
      const o = v as Record<string, unknown>;
      if (typeof o.ar !== 'string' || !o.ar.trim() || typeof o.en !== 'string' || !o.en.trim()) problems.push(`${where}: missing ar or en`);
    }
  };
  const walk = (fields: Node[] | undefined, path: string) => {
    for (const f of fields ?? []) {
      const here = `${path}.${f.name ?? '(layout)'}`;
      if (f.name && !f.admin?.hidden) {
        // without a label Payload shows the field's code name ("source", "targetId") in both languages
        if (f.label === undefined) problems.push(`${here}: no label`);
        else bilingual(f.label, `${here} label`);
      }
      bilingual(f.admin?.description, `${here} description`);
      for (const o of (f.options ?? []) as { label?: unknown; value?: string }[]) {
        if (typeof o !== 'object') continue;
        // a language listed by its own name ("Español (es)") reads the same in every interface on purpose
        if (typeof o.label === 'string' && o.label.endsWith(`(${o.value})`)) continue;
        bilingual(o.label, `${here} option`);
      }
      walk(f.fields, here);
      walk(f.tabs, here);
    }
  };
  for (const c of collections) {
    bilingual(c.labels?.singular, `${c.slug} singular`);
    bilingual(c.labels?.plural, `${c.slug} plural`);
    bilingual(c.admin?.group, `${c.slug} group`);
    walk(c.fields as Node[], c.slug);
  }

  bilingual(Site.label, 'site global label');
  bilingual(Site.admin?.group, 'site global group');
  walk(Site.fields as Node[], 'site');

  test('every collection, the site settings, groups, visible fields, options and descriptions have Arabic and English', () => {
    assert.deepEqual(problems, []);
  });
});

test('the dashboard says how much is waiting with the noun agreeing with the number', () => {
  const ar = (n: number) => waitingLine('ar', n);
  assert.equal(ar(0), 'لا شيء ينتظرك من الزوار الآن.');
  assert.equal(ar(1), 'ينتظرك أمر واحد من الزوار.');
  assert.equal(ar(2), 'ينتظرك أمران من الزوار.');
  assert.equal(ar(3), 'ينتظرك 3 أمور من الزوار.');
  assert.equal(ar(10), 'ينتظرك 10 أمور من الزوار.');
  assert.equal(ar(11), 'ينتظرك 11 أمرًا من الزوار.');
  assert.equal(ar(99), 'ينتظرك 99 أمرًا من الزوار.');
  assert.equal(ar(100), 'ينتظرك 100 أمر من الزوار.');
  assert.equal(waitingLine('en', 1), 'One item from visitors is waiting for you.');
  assert.equal(waitingLine('en', 12, (n) => n.toLocaleString('en')), '12 items from visitors are waiting for you.');
});

test('the queues: editors and admins get every visitor queue, translation reviewers only their reports, each with a filtered list', async () => {
  const { queuesFor, queueHref, QUEUES } = await import('../../src/admin/queues.ts');
  const { dashboardStrings } = await import('../../src/admin/i18n.ts');
  assert.deepEqual(queuesFor('editor').map((q) => q.key), ['receipts', 'orders', 'pledges', 'volunteers', 'messages', 'reviews']);
  assert.deepEqual(queuesFor('admin').map((q) => q.key), queuesFor('editor').map((q) => q.key));
  assert.deepEqual(queuesFor('reviewer').map((q) => q.key), ['tr']);
  for (const q of QUEUES) {
    assert.match(queueHref(q), /^\/admin\/collections\/[a-z-]+\?where\[/, q.key);
    for (const lang of ['ar', 'en']) for (const k of [q.label, q.quiet, q.hint]) assert.ok(dashboardStrings(lang)[k], `${lang} ${k}`);
  }
});
