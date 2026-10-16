#!/usr/bin/env node
/**
 * Repeatable Lighthouse run (lab data!) against a running site.
 *
 *   node scripts/lighthouse.mjs https://hadramout-center.novixa.dev --out docs/09-redesign/evidence/lighthouse-live.json
 *   node scripts/lighthouse.mjs http://localhost:3100 --paths /ar,/ar/articles,/ar/articles/894 --presets mobile,desktop
 *
 * Needs a Chrome/Chromium (CHROME_PATH or a standard install location) and network access to fetch `lighthouse` via npx.
 * Chrome is started by this script with a remote-debugging port and a throw-away profile; raw reports go to `.lighthouse/`
 * (git-ignored), a compact summary to --out. Lab numbers are not field data (Core Web Vitals at the 75th percentile).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:/.test(a)) ?? 'http://localhost:3000').replace(/\/$/, '');
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const paths = opt('paths', '/ar,/ar/articles,/ar/articles/894,/ar/books/37,/ar/search?q=%D8%AD%D8%B6%D8%B1%D9%85%D9%88%D8%AA').split(',');
const presets = opt('presets', 'mobile,desktop').split(',');
const out = opt('out');
const port = Number(opt('port', '9334'));

const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) throw new Error('No Chrome found. Set CHROME_PATH.');

const profile = mkdtempSync(join(tmpdir(), 'hc-lh-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 4000));

mkdirSync('.lighthouse', { recursive: true });
const rows = [];
for (const preset of presets) {
  for (const p of paths) {
    const name = `${p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}-${preset}`;
    const file = `.lighthouse/${name}.json`;
    const r = spawnSync('npx', ['--yes', 'lighthouse@13.5.0', base + p, `--port=${port}`, '--only-categories=performance,accessibility,best-practices,seo', '--output=json', `--output-path=${file}`, '--quiet', ...(preset === 'desktop' ? ['--preset=desktop'] : [])], { encoding: 'utf8', shell: process.platform === 'win32' });
    if (!existsSync(file)) {
      rows.push({ path: p, preset, error: (r.stderr || r.stdout || 'no report').trim().split('\n').pop() });
      continue;
    }
    const j = JSON.parse(readFileSync(file, 'utf8'));
    const score = (k) => (j.categories?.[k]?.score == null ? null : Math.round(j.categories[k].score * 100));
    const a = (id) => j.audits?.[id]?.numericValue;
    rows.push({
      path: p,
      preset,
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
      fcpMs: Math.round(a('first-contentful-paint') ?? 0) || null,
      lcpMs: Math.round(a('largest-contentful-paint') ?? 0) || null,
      tbtMs: Math.round(a('total-blocking-time') ?? 0),
      cls: a('cumulative-layout-shift') == null ? null : +a('cumulative-layout-shift').toFixed(3),
      transferKB: Math.round((a('total-byte-weight') ?? 0) / 1024),
      failed: Object.values(j.audits ?? {}).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable').map((x) => x.id),
      runtimeError: j.runtimeError?.code,
    });
    console.log(rows.at(-1));
  }
}
proc.kill();
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* profile still locked on Windows: harmless */
}
const summary = { base, at: new Date().toISOString(), tool: 'lighthouse 13.5.0 (lab, simulated throttling for mobile)', rows };
if (out) writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`);
console.table(rows.map(({ failed: _failed, ...r }) => r));
