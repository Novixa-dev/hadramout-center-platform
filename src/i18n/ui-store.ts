import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * UI strings.
 *   messages/ar.json, messages/en.json   hand-written, committed (Arabic is the source of truth)
 *   $DATA_DIR/i18n/<lang>.json           machine-translated bundles { strings, hashes }, written by the job
 */
const MESSAGES_DIR = resolve(process.cwd(), 'messages');

export type Dict = Record<string, string>;
export interface UiBundle {
  strings: Dict;
  hashes: Dict;
}

// runtime data directory: turbopackIgnore keeps the build from tracing (and bundling) the whole project for it
const dataDir = () => resolve(/* turbopackIgnore: true */ process.env.DATA_DIR ?? './data');
// Callers validate languages against the registry; this guard keeps any other value from ever becoming a file path.
const LANG_TAG = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const langFile = (dir: string, lang: string) => {
  if (!LANG_TAG.test(lang)) throw new RangeError(`not a language tag: ${JSON.stringify(lang)}`);
  return join(dir, `${lang}.json`);
};
const bundlePath = (lang: string) => langFile(join(dataDir(), 'i18n'), lang);

const cache = new Map<string, { mtime: number; value: unknown }>();

function readJson<T>(path: string, fallback: T): T {
  let mtime: number;
  try {
    mtime = statSync(path).mtimeMs;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw e;
  }
  const hit = cache.get(path);
  if (hit && hit.mtime === mtime) return hit.value as T;
  const value = JSON.parse(readFileSync(path, 'utf8')) as T;
  cache.set(path, { mtime, value });
  return value;
}

export function loadSourceMessages(): Dict {
  return readJson<Dict>(join(MESSAGES_DIR, 'ar.json'), {});
}

export function loadCuratedMessages(lang: string): Dict {
  return readJson<Dict>(langFile(MESSAGES_DIR, lang), {});
}

export function loadUiBundle(lang: string): UiBundle {
  return readJson<UiBundle>(bundlePath(lang), { strings: {}, hashes: {} });
}

export function writeUiBundle(lang: string, bundle: UiBundle): void {
  const path = bundlePath(lang);
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(bundle));
  renameSync(tmp, path);
}

/** Messages for `lang` with the fallback chain lang → en → ar already merged (later spreads lose). */
export function messagesFor(lang: string): Dict {
  const ar = loadSourceMessages();
  if (lang === 'ar') return ar;
  const en = loadCuratedMessages('en');
  if (lang === 'en') return { ...ar, ...en };
  return { ...ar, ...en, ...loadUiBundle(lang).strings, ...loadCuratedMessages(lang) };
}

/** Fraction of Arabic UI keys that `lang` really has (not just falling back). */
export function uiCoverage(lang: string): number {
  if (lang === 'ar') return 1;
  const keys = Object.keys(loadSourceMessages());
  if (!keys.length) return 1;
  const own = { ...loadUiBundle(lang).strings, ...loadCuratedMessages(lang) };
  return keys.filter((k) => k in own).length / keys.length;
}
