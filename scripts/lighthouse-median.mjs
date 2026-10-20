#!/usr/bin/env node
/**
 * Median of several Lighthouse runs (single lab runs vary a lot, especially TBT and LCP).
 *
 *   node scripts/lighthouse-median.mjs .lighthouse-runs            # reads run-*.json written by scripts/lighthouse.mjs --out
 *
 * Prints a Markdown table (suitable for $GITHUB_STEP_SUMMARY). Report-only: always exits 0 unless the input is unusable.
 * Targets come from docs/quality/PERFORMANCE_PLAN.md.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// LCP has no lab target on purpose: Lighthouse's mobile LCP is a MODEL of a slow phone on slow 4G (about 3 s for a page that Chrome itself measures at ~0.2 s).
// It is shown for trend only; the real LCP target (<= 2.5 s at the 75th percentile) is judged on field data (Search Console / Cloudflare Web Analytics).
export const TARGETS = { performance: 80, tbtMs: 600, cls: 0.1, accessibility: 95 };

/** Median ignoring null/undefined/NaN; null when nothing is left. */
export function median(values) {
  const v = values.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** runs: array of summaries ({rows:[{path,preset,performance,...}]}) → one row per path+preset with medians and the number of valid runs. */
export function aggregate(runs) {
  const groups = new Map();
  for (const run of runs) {
    for (const row of run.rows ?? []) {
      const key = `${row.preset}|${row.path}`;
      if (!groups.has(key)) groups.set(key, { preset: row.preset, path: row.path, rows: [] });
      groups.get(key).rows.push(row);
    }
  }
  return [...groups.values()].map(({ preset, path, rows }) => {
    const valid = rows.filter((r) => !r.error && !r.runtimeError && r.performance != null);
    const m = (k) => median(valid.map((r) => r[k]));
    return { preset, path, runs: rows.length, valid: valid.length, performance: m('performance'), accessibility: m('accessibility'), seo: m('seo'), fcpMs: m('fcpMs'), lcpMs: m('lcpMs'), observedLcpMs: m('observedLcpMs'), tbtMs: m('tbtMs'), cls: m('cls') };
  });
}

const fmt = (v, digits = 0) => (v == null ? 'n/a' : Number(v).toFixed(digits));
const mark = (ok) => (ok === null ? '' : ok ? ' ✅' : ' ❌');

export function toMarkdown(rows, targets = TARGETS) {
  const head = ['| Page | Preset | Perf | LCP modeled (ms) | LCP observed (ms) | TBT (ms) | CLS | FCP modeled (ms) | A11y | SEO | valid/runs |', '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
  const body = rows.map((r) => {
    const t = (v, pass) => (v == null ? null : pass(v));
    return `| \`${r.path}\` | ${r.preset} | ${fmt(r.performance)}${mark(t(r.performance, (v) => v >= targets.performance))} | ${fmt(r.lcpMs)} | ${fmt(r.observedLcpMs)} | ${fmt(r.tbtMs)}${mark(t(r.tbtMs, (v) => v <= targets.tbtMs))} | ${fmt(r.cls, 3)}${mark(t(r.cls, (v) => v <= targets.cls))} | ${fmt(r.fcpMs)} | ${fmt(r.accessibility)}${mark(t(r.accessibility, (v) => v >= targets.accessibility))} | ${fmt(r.seo)} | ${r.valid}/${r.runs} |`;
  });
  return [`### Lighthouse (median of runs; lab data, not field data)`, '', `Targets: performance ≥ ${targets.performance}, TBT ≤ ${targets.tbtMs} ms, CLS ≤ ${targets.cls}, accessibility ≥ ${targets.accessibility}. "Modeled" values come from Lighthouse's slow-phone simulation (trend only, not judged); "observed" is what Chrome measured on the runner. The real LCP target (≤ 2.5 s, 75th percentile) needs field data. Report only: the job does not fail yet. Run-to-run noise is roughly ±150–300 ms: compare medians of at least three runs and ignore smaller differences.`, '', ...head, ...body, ''].join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node scripts/lighthouse-median.mjs <dir with run-*.json>');
    process.exit(2);
  }
  const runs = readdirSync(dir)
    .filter((f) => /^run-.*\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  if (runs.length === 0) {
    console.error(`no run-*.json files in ${dir}`);
    process.exit(2);
  }
  console.log(toMarkdown(aggregate(runs)));
}
