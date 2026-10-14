/**
 * Typed, validated runtime settings read from environment variables (the same image runs
 * unchanged in dev, CI and production). Payload's own settings (DATABASE_URL, PAYLOAD_SECRET)
 * are read in payload.config.ts; everything application-specific lives here.
 */

export type TranslationProviderName = 'none' | 'mock' | 'anthropic' | 'google' | 'libretranslate';

export interface Config {
  env: 'development' | 'production' | 'test';
  isProd: boolean;
  siteUrl: string;
  dataDir: string;
  defaultLang: string;
  enabledLangs: '*' | string[];
  /** languages whose COMPLETE translations may be indexed by search engines ("*" = any complete one) */
  indexableLangs: '*' | string[];
  translation: {
    provider: TranslationProviderName;
    eagerLangs: string[];
    concurrency: number;
    dailyCharLimit: number;
    model: string;
    anthropicApiKey: string;
    googleApiKey: string;
    libreUrl: string;
    libreApiKey: string;
  };
}

const PROVIDERS: readonly TranslationProviderName[] = ['none', 'mock', 'anthropic', 'google', 'libretranslate'];

function list(value: string | undefined, fallback: string): '*' | string[] {
  const raw = (value ?? fallback).trim();
  if (raw === '*' || raw === '') return '*';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function csv(value: string | undefined, fallback: string): string[] {
  const r = list(value, fallback);
  return r === '*' ? [] : r;
}

function intFrom(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${name}: "${value}" must be a non-negative integer`);
  return n;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const nodeEnv = (env.NODE_ENV ?? 'development') as Config['env'];
  const isProd = nodeEnv === 'production';

  const siteUrl = (env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  try {
    new URL(siteUrl);
  } catch {
    throw new Error(`Invalid SITE_URL: "${siteUrl}"`);
  }

  const provider = (env.TRANSLATION_PROVIDER ?? 'none') as TranslationProviderName;
  if (!PROVIDERS.includes(provider)) {
    throw new Error(`Invalid TRANSLATION_PROVIDER "${provider}". Use one of: ${PROVIDERS.join(', ')}`);
  }
  if (isProd && provider === 'mock') throw new Error('TRANSLATION_PROVIDER=mock is for development only');
  if (provider === 'anthropic' && !env.ANTHROPIC_API_KEY) throw new Error('TRANSLATION_PROVIDER=anthropic requires ANTHROPIC_API_KEY');
  if (provider === 'google' && !env.GOOGLE_TRANSLATE_API_KEY) throw new Error('TRANSLATION_PROVIDER=google requires GOOGLE_TRANSLATE_API_KEY');

  return {
    env: nodeEnv,
    isProd,
    siteUrl,
    dataDir: env.DATA_DIR ?? './data',
    defaultLang: (env.DEFAULT_LANG ?? 'ar').toLowerCase(),
    enabledLangs: list(env.ENABLED_LANGS, '*'),
    indexableLangs: list(env.INDEXABLE_LANGS, '*'),
    translation: {
      provider,
      eagerLangs: csv(env.TRANSLATION_EAGER_LANGS, 'en'),
      concurrency: Math.max(1, intFrom(env.TRANSLATION_CONCURRENCY, 2, 'TRANSLATION_CONCURRENCY')),
      dailyCharLimit: intFrom(env.TRANSLATION_DAILY_CHAR_LIMIT, 2_000_000, 'TRANSLATION_DAILY_CHAR_LIMIT'),
      model: env.TRANSLATION_MODEL ?? 'claude-opus-5-5',
      anthropicApiKey: env.ANTHROPIC_API_KEY ?? '',
      googleApiKey: env.GOOGLE_TRANSLATE_API_KEY ?? '',
      libreUrl: (env.LIBRETRANSLATE_URL ?? 'http://localhost:5000').replace(/\/+$/, ''),
      libreApiKey: env.LIBRETRANSLATE_API_KEY ?? '',
    },
  };
}

/** True when `lang` may be translated/served under the ENABLED_LANGS policy (Arabic always is). */
export function isLangEnabled(config: Config, lang: string): boolean {
  return lang === 'ar' || config.enabledLangs === '*' || config.enabledLangs.includes(lang);
}
