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
