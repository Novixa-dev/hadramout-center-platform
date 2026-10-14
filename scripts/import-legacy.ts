/**
 * Pull every item from the live legacy site into content/legacy-snapshot.json.gz.
 *
 *   npm run import:legacy                       # everything (≈1,460 pages, resumable via .cache/legacy)
 *   npm run import:legacy -- --types=news,book  # subset
 *   npm run import:legacy -- --limit=5          # smoke test
 *   npm run import:legacy -- --refresh          # ignore the page cache
 *   npm run import:legacy -- --offline          # re-parse everything from .cache/legacy (no network)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { crawlLegacy } from '../src/importer/crawl.ts';
import type { PostType } from '../src/importer/legacy.ts';

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k as string, v ?? 'true'] as const;
  }),
);

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, args.get('out') ?? 'content/legacy-snapshot.json.gz');
const types = args.get('types')?.split(',').filter(Boolean) as PostType[] | undefined;
const limit = args.has('limit') ? Number(args.get('limit')) : undefined;

const started = Date.now();
const { snapshot, report } = await crawlLegacy({
  cacheDir: resolve(root, '.cache/legacy'),
  types,
  limit,
  refresh: args.has('refresh'),
  offline: args.has('offline'),
  concurrency: Number(args.get('concurrency') ?? 4),
  log: (m) => console.log(m),
});

mkdirSync(dirname(out), { recursive: true });
const json = JSON.stringify(snapshot);
writeFileSync(out, gzipSync(json, { level: 9 }));

console.log('\n════════ Import report ════════');
for (const [type, found] of Object.entries(report.discovered)) {
  const got = report.imported[type] ?? 0;
  const flag = got === found ? '✔' : limit ? '·' : '✖';
  console.log(`${flag} ${type.padEnd(9)} discovered ${String(found).padStart(4)}  imported ${String(got).padStart(4)}`);
}
console.log(`\nFailed: ${report.failed.length}`);
for (const f of report.failed.slice(0, 20)) console.log(`  - ${f.type}/${f.id}: ${f.reason}`);
const grouped = new Map<string, number>();
for (const w of report.warnings) grouped.set(`${w.type}: ${w.message}`, (grouped.get(`${w.type}: ${w.message}`) ?? 0) + 1);
console.log(`Warnings: ${report.warnings.length}`);
for (const [k, n] of [...grouped].sort((a, b) => b[1] - a[1])) console.log(`  - ${k} ×${n}`);
if (Object.keys(report.extraLabels).length) console.log('Unmapped book labels:', report.extraLabels);
console.log(`Books without a verified publication year: ${report.missingYearBooks}`);
console.log(`\nSnapshot: ${out} (${(json.length / 1024 / 1024).toFixed(1)} MB raw, ${(gzipSync(json).length / 1024 / 1024).toFixed(1)} MB gz) in ${((Date.now() - started) / 1000).toFixed(0)}s`);
process.exitCode = report.failed.length > 0 && !limit ? 1 : 0;
