import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * WCAG 2.2 contrast of the design tokens (src/styles/tokens.css), light and dark.
 * Text pairs need 4.5:1 (AA); UI component boundaries / focus rings need 3:1.
 */
const css = readFileSync('src/styles/tokens.css', 'utf8');
const raw = new Map<string, string>();
for (const m of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) if (!raw.has(m[1] as string)) raw.set(m[1] as string, (m[2] as string).trim());

type Mode = 'light' | 'dark';

function resolve(name: string, mode: Mode, depth = 0): string {
  let v = raw.get(name);
  if (!v || depth > 6) throw new Error(`token --${name} not found`);
  const ld = v.match(/^light-dark\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (ld) v = (mode === 'light' ? ld[1] : ld[2]) as string;
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (ref) return resolve(ref[1] as string, mode, depth + 1);
  return v;
}

function lum(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

const TEXT_PAIRS: [string, string][] = [
  ['text', 'bg'], ['text', 'surface'], ['text-2', 'bg'], ['text-2', 'surface'], ['text-2', 'surface-2'], ['text-2', 'surface-3'],
  ['muted', 'bg'], ['muted', 'surface'], ['muted', 'surface-2'],
  // the top of the light page is the deeper gold tint
  ['text', 'bg-tint'], ['text-2', 'bg-tint'], ['muted', 'bg-tint'], ['brand', 'bg-tint'], ['accent-text', 'bg-tint'],
  // the teal band above the header (light and dark)
  ['strata-text', 'strata-bg'],
  ['brand', 'bg'], ['brand', 'surface'], ['brand', 'surface-2'], ['brand', 'brand-soft'], ['brand-strong', 'surface'],
  ['accent-text', 'bg'], ['accent-text', 'surface'], ['accent-text', 'surface-2'], ['accent-text', 'accent-soft'],
  ['danger', 'surface'], ['success', 'surface'], ['warning', 'surface'],
];

describe('design token contrast (WCAG 2.2 AA)', () => {
  for (const mode of ['light', 'dark'] as const) {
    test(`${mode}: every text pair reaches 4.5:1`, () => {
      const low = TEXT_PAIRS.map(([fg, bg]) => ({ fg, bg, r: ratio(resolve(fg, mode), resolve(bg, mode)) })).filter((x) => x.r < 4.5);
      assert.deepEqual(low.map((x) => `${x.fg} on ${x.bg}: ${x.r.toFixed(2)}`), []);
    });
    test(`${mode}: buttons — on-brand over brand-fill, gold button text`, () => {
      assert.ok(ratio(resolve('on-brand', mode), resolve('brand-fill', mode)) >= 4.5);
    });
    test(`${mode}: focus ring and control borders reach 3:1 against the page`, () => {
      assert.ok(ratio(resolve('focus', mode), resolve('bg', mode)) >= 3, 'focus ring');
      assert.ok(ratio(resolve('focus', mode), resolve('surface', mode)) >= 3, 'focus ring on cards');
    });
  }
  test('gold button (dark text on gold) is readable', () => assert.ok(ratio('#2b2008', resolve('gold-500', 'light')) >= 4.5));
  test('hero text on the hero background', () => {
    for (const mode of ['light', 'dark'] as const) assert.ok(ratio(resolve('hero-text', mode), resolve('hero-bg', mode)) >= 7, mode);
  });
});

/** The prefers-contrast: more block overrides some tokens; everything else keeps its base value. */
function highContrastOverrides(): Map<string, string> {
  const start = css.indexOf('@media (prefers-contrast: more)');
  assert.ok(start >= 0, 'high-contrast block exists');
  const block = css.slice(start, css.indexOf('\n  }\n', start));
  const out = new Map<string, string>();
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) out.set(m[1] as string, (m[2] as string).trim());
  return out;
}

describe('high-contrast tokens (prefers-contrast: more) reach WCAG AAA', () => {
  const overrides = highContrastOverrides();
  const value = (name: string, mode: Mode): string => {
    const o = overrides.get(name);
    if (!o) return resolve(name, mode);
    const ld = o.match(/^light-dark\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
    return ld ? ((mode === 'light' ? ld[1] : ld[2]) as string) : o;
  };
  const SURFACES = ['bg', 'surface', 'surface-2', 'surface-3'];
  for (const mode of ['light', 'dark'] as const) {
    test(`${mode}: text, secondary text, muted text and brand text reach 7:1 on every surface`, () => {
      const low: string[] = [];
      for (const fg of ['text', 'text-2', 'muted', 'brand', 'accent-text']) {
        for (const bg of SURFACES) {
          const r = ratio(value(fg, mode), value(bg, mode));
          if (r < 7) low.push(`${fg} on ${bg}: ${r.toFixed(2)}`);
        }
      }
      assert.deepEqual(low, []);
    });
    test(`${mode}: borders are visible (3:1) and the focus ring reaches 7:1`, () => {
      for (const bg of ['bg', 'surface']) {
        assert.ok(ratio(value('border', mode), value(bg, mode)) >= 3, `border on ${bg}`);
        assert.ok(ratio(value('border-strong', mode), value(bg, mode)) >= 4.5, `border-strong on ${bg}`);
        assert.ok(ratio(value('focus', mode), value(bg, mode)) >= 7, `focus on ${bg}`);
      }
    });
  }
});

describe('admin dashboard colours (src/app/(payload)/custom.scss)', () => {
  const scss = readFileSync('src/app/(payload)/custom.scss', 'utf8');
  const block = (selector: string) => {
    const at = scss.indexOf(`${selector} {`);
    if (at < 0) throw new Error(`${selector} not found`);
    return scss.slice(at, scss.indexOf('\n}', at));
  };
  const pick = (src: string, name: string): string => {
    const m = src.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6}|rgb\\([^)]*\\))`));
    if (!m) throw new Error(`--${name} not found`);
    return m[1] as string;
  };
  const base = (n: number) => pick(scss, `color-base-${n}`);
  const light = block('.hc-dash');
  const dark = block("html[data-theme='dark'] .hc-dash");
  // a token the dark block does not redefine keeps its light value, as in CSS
  const token = (mode: 'light' | 'dark', name: string) => (mode === 'dark' && new RegExp(`--${name}:`).test(dark) ? pick(dark, name) : pick(light, name));
  // Payload's page background: elevation-0 is base-0 in light and base-900 in dark
  const page = { light: base(0), dark: base(900) };
  const hex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  const rgb = (h: string) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16));
  /** An `rgb(r g b / a)` colour over a solid background, as the browser paints it. */
  const solid = (c: string, under: string): string => {
    const m = c.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)/);
    if (!m) return c;
    const a = Number(m[4]);
    return hex([1, 2, 3].map((i, k) => Number(m[i]) * a + (rgb(under)[k] as number) * (1 - a)));
  };
  for (const mode of ['light', 'dark'] as const) {
    test(`${mode}: dashboard text, numbers, date squares, chips and the gold button reach 4.5:1`, () => {
      const bg = page[mode];
      const t = (n: string) => token(mode, n);
      const pairs: [string, string, string][] = [
        ['text on page', t('d-text'), bg],
        ['secondary text on page', t('d-text-2'), bg],
        ['muted text on page', t('d-muted'), bg],
        ['muted text on the head band', t('d-muted'), t('d-surface-2')],
        ['secondary text on the head band', t('d-text-2'), t('d-surface-2')],
        ['green numbers on page', t('d-brand'), bg],
        ['green numbers on the head band', t('d-brand'), t('d-surface-2')],
        ['white on the date squares', t('d-on-brand'), t('d-brand-fill')],
        ['backlog square text', t('d-text-2'), t('d-surface-3')],
        ['gold text on its tint', t('d-accent-text'), solid(t('d-accent-soft'), bg)],
        ['dark text on the gold button', t('d-on-accent'), t('d-accent')],
        ['green on its tint (status, hover)', t('d-brand'), t('d-brand-soft')],
      ];
      const low = pairs.filter(([, fg, back]) => ratio(fg, back) < 4.5).map(([what, fg, back]) => `${what}: ${ratio(fg, back).toFixed(2)}`);
      assert.deepEqual(low, []);
    });
  }
});
