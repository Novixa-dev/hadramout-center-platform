/**
 * Pre-fills the local image cache (`$DATA_DIR/legacy-media`) with every image of the old site that the content
 * references (covers + images inside bodies). Resumable: files already cached are skipped.
 *
 *   npm run import:images            # download everything missing
 *   npm run import:images -- --dry   # only count
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { LEGACY_FILES_ORIGIN, resolveLegacyPath } from '../src/lib/legacy-media.ts';

const dry = process.argv.includes('--dry');
const dbFile = (process.env.DATABASE_URL ?? 'file:./data/payload.db').replace(/^file:/, '');
const db = new DatabaseSync(resolve(dbFile), { readOnly: true });

const TABLES = ['news', 'articles', 'books', 'magazines', 'events', 'forum_events', 'videos', 'pages'];
const RE = /https?:\/\/files\.hadramout\.center\/media\/([^"'\s<>)]+)/gi;
const wanted = new Set<string>();
const collect = (text: unknown) => {
  if (typeof text !== 'string') return;
  for (const m of text.matchAll(RE)) wanted.add(m[1]!.replace(/[?#].*$/, ''));
};
for (const t of TABLES) {
  for (const sql of [`SELECT body FROM ${t}_locales WHERE body LIKE '%files.hadramout.center%'`, `SELECT cover_url FROM ${t} WHERE cover_url IS NOT NULL`]) {
    try {
      for (const row of db.prepare(sql).all() as Record<string, unknown>[]) collect(Object.values(row)[0]);
    } catch {
      /* table/column does not exist for this collection */
    }
  }
}

const todo: { rel: string; file: string }[] = [];
for (const raw of wanted) {
  let target;
  try {
    target = resolveLegacyPath(raw.split('/'));
  } catch {
    continue;
  }
  if (target && !existsSync(target.file)) todo.push(target);
}
console.log(`${wanted.size} distinct images referenced, ${todo.length} not cached yet`);
if (dry || todo.length === 0) process.exit(0);

let done = 0;
let failed = 0;
async function fetchOne({ rel, file }: { rel: string; file: string }) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${LEGACY_FILES_ORIGIN}/media/${rel.split('/').map(encodeURIComponent).join('/')}`, { signal: AbortSignal.timeout(30_000) });
      if (res.status === 404) return false;
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !/^(image\/|application\/pdf)/.test(type)) throw new Error(`HTTP ${res.status} ${type}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await writeFile(tmp, buf);
      await rename(tmp, file);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return false;
}

const queue = [...todo];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      if (await fetchOne(item)) done++;
      else {
        failed++;
        console.warn(`✗ ${item.rel}`);
      }
      if ((done + failed) % 50 === 0) console.log(`  ${done + failed}/${todo.length}`);
    }
  }),
);
console.log(`✔ downloaded ${done}, failed ${failed} (failed ones are retried lazily when first requested)`);
