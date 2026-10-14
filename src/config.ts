import { resolve } from 'node:path';

/**
 * Typed, validated runtime configuration. Everything comes from environment
 * variables so the same image runs unchanged in dev, CI and production.
 */

export type TranslationProviderName = 'none' | 'mock' | 'anthropic' | 'google' | 'libretranslate';

export interface Config {
  env: 'development' | 'production' | 'test';
  isProd: boolean;
  host: string;
  port: number;
  logLevel: string;
  siteUrl: string;
  dataDir: string;
  dbPath: string;
  uploadsDir: string;
  backupsDir: string;
  sessionSecret: string;
  trustProxy: boolean;
  defaultLang: string;
  enabledLangs: '*' | string[];
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
  adminBootstrap: { email: string; password: string };
  turnstile: { siteKey: string; secretKey: string };
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

function boolFrom(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
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

  const sessionSecret = env.SESSION_SECRET ?? 'dev-only-insecure-secret-do-not-use-in-production';
  if (isProd && (sessionSecret.length < 32 || sessionSecret.startsWith('change-me') || sessionSecret.startsWith('dev-only'))) {
    throw new Error('SESSION_SECRET must be a random string of at least 32 characters in production');
  }

  const provider = (env.TRANSLATION_PROVIDER ?? 'none') as TranslationProviderName;
  if (!PROVIDERS.includes(provider)) {
    throw new Error(`Invalid TRANSLATION_PROVIDER "${provider}". Use one of: ${PROVIDERS.join(', ')}`);
  }
  if (provider === 'anthropic' && !env.ANTHROPIC_API_KEY) throw new Error('TRANSLATION_PROVIDER=anthropic requires ANTHROPIC_API_KEY');
  if (provider === 'google' && !env.GOOGLE_TRANSLATE_API_KEY) throw new Error('TRANSLATION_PROVIDER=google requires GOOGLE_TRANSLATE_API_KEY');

  const dataDir = resolve(env.DATA_DIR ?? './data');

  return {
    env: nodeEnv,
    isProd,
    host: env.HOST ?? (isProd ? '0.0.0.0' : '127.0.0.1'),
    port: intFrom(env.PORT, 3000, 'PORT'),
    logLevel: env.LOG_LEVEL ?? (nodeEnv === 'test' ? 'silent' : 'info'),
    siteUrl,
    dataDir,
    dbPath: resolve(env.DB_PATH ?? `${dataDir}/hadramout.db`),
    uploadsDir: resolve(env.UPLOADS_DIR ?? `${dataDir}/uploads`),
    backupsDir: resolve(env.BACKUPS_DIR ?? `${dataDir}/backups`),
    sessionSecret,
    trustProxy: boolFrom(env.TRUST_PROXY, false),
    defaultLang: (env.DEFAULT_LANG ?? 'ar').toLowerCase(),
    enabledLangs: list(env.ENABLED_LANGS, '*'),
    indexableLangs: list(env.INDEXABLE_LANGS, '*'),
    translation: {
      provider,
      eagerLangs: csv(env.TRANSLATION_EAGER_LANGS, 'en'),
      concurrency: Math.max(1, intFrom(env.TRANSLATION_CONCURRENCY, 2, 'TRANSLATION_CONCURRENCY')),
      dailyCharLimit: intFrom(env.TRANSLATION_DAILY_CHAR_LIMIT, 2_000_000, 'TRANSLATION_DAILY_CHAR_LIMIT'),
      model: env.TRANSLATION_MODEL ?? 'claude-haiku-5-5',
      anthropicApiKey: env.ANTHROPIC_API_KEY ?? '',
      googleApiKey: env.GOOGLE_TRANSLATE_API_KEY ?? '',
      libreUrl: (env.LIBRETRANSLATE_URL ?? 'http://localhost:5000').replace(/\/+$/, ''),
      libreApiKey: env.LIBRETRANSLATE_API_KEY ?? '',
    },
    adminBootstrap: {
      email: (env.ADMIN_BOOTSTRAP_EMAIL ?? '').trim().toLowerCase(),
      password: env.ADMIN_BOOTSTRAP_PASSWORD ?? '',
    },
    turnstile: { siteKey: env.TURNSTILE_SITE_KEY ?? '', secretKey: env.TURNSTILE_SECRET_KEY ?? '' },
  };
}
