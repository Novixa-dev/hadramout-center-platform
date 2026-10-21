import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every UI string the code asks for must exist in the Arabic source (messages/ar.json) and in the curated English file,
 * so no page ever renders a raw key like "list.chip.year". Dynamic keys are listed explicitly below.
 */
const ar = JSON.parse(readFileSync('messages/ar.json', 'utf8')) as Record<string, string>;
const en = JSON.parse(readFileSync('messages/en.json', 'utf8')) as Record<string, string>;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'migrations' || name === 'node_modules') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('payload-types.ts')) out.push(p);
  }
  return out;
}

const DYNAMIC = [
  ...['article', 'news', 'book', 'magazine', 'video', 'event', 'forum'].map((t) => `card.type.${t}`),
  ...['news', 'articles', 'books', 'magazines', 'events', 'forum-events', 'videos'].map((t) => `type.${t}`),
  ...['grid', 'list', 'compact'].map((v) => `list.view.${v}`),
];

const used = new Set<string>(DYNAMIC);
const re = /\bt\(\s*(['"`])([a-z][A-Za-z0-9_.-]*\.[A-Za-z0-9_.-]+)\1/g;
for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(re)) used.add(m[2] as string);
  // keys passed as data: { title: 'home.hero.title' }, TITLE_KEY maps, nav tables…
  for (const m of src.matchAll(/['"`]((?:nav|home|list|search|topics|reviews|reader|timeline|authors|event|pdf|pager|cite|footer|saved|og|magazine|meta|article|book|news|events|forum|videos|articles|books|magazines|contact|a11y|error|tools|share|theme|lang|tr|card|newsletter|section|header|site|video)\.[A-Za-z0-9_.-]+)['"`]/g)) used.add(m[1] as string);
}

// plural forms are looked up as key.one / key.other; the base key may not exist on its own
// Open Graph type names share the 'video.' prefix with UI keys but are not messages
const NOT_MESSAGES = new Set(['video.other']);
const has = (dict: Record<string, string>, key: string) => key in dict || `${key}.other` in dict || `${key}.one` in dict;

describe('UI messages', () => {
  test('every key used in the code exists in messages/ar.json', () => {
    const missing = [...used].filter((k) => !NOT_MESSAGES.has(k) && !has(ar, k) && /^[a-z]+\.[A-Za-z0-9_.-]+$/.test(k) && !k.endsWith('.ts') && !k.endsWith('.tsx') && !/\.(css|json|png|svg|xml|ics|ris|bib)$/.test(k)).sort();
    assert.deepEqual(missing, [], `missing in ar.json:\n${missing.join('\n')}`);
  });
  test('the curated English file covers every Arabic key', () => {
    const missing = Object.keys(ar).filter((k) => !(k in en)).sort();
    assert.deepEqual(missing, [], `missing in en.json:\n${missing.join('\n')}`);
  });
  test('placeholders match between Arabic and English', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const bad = Object.keys(ar).filter((k) => k in en && ph(ar[k] as string) !== ph(en[k] as string));
    assert.deepEqual(bad, [], `placeholder mismatch: ${bad.join(', ')}`);
  });
});
