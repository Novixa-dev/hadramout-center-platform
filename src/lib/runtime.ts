import { getPayload, type Payload } from 'payload';
import config from '@payload-config';
import { isLangEnabled, loadConfig, type Config } from '../config.ts';
import { createProvider } from '../i18n/translation/providers.ts';
import { TranslationEngine } from '../i18n/translation/engine.ts';

/**
 * Server-side singletons shared by pages, route handlers, hooks and jobs.
 * Cached on globalThis so Next.js hot reloads in development don't create duplicates.
 */
interface Globals {
  __hcConfig?: Config;
  __hcEngine?: Map<Payload, TranslationEngine>;
}
const g = globalThis as Globals;

export function appConfig(): Config {
  g.__hcConfig ??= loadConfig();
  return g.__hcConfig;
}

export async function getPayloadClient(): Promise<Payload> {
  return getPayload({ config });
}

export function engineFor(payload: Payload, onChange?: ConstructorParameters<typeof TranslationEngine>[0]['onChange']): TranslationEngine {
  g.__hcEngine ??= new Map();
  let engine = g.__hcEngine.get(payload);
  if (!engine) {
    const cfg = appConfig();
    engine = new TranslationEngine({
      payload,
      provider: createProvider(cfg as never),
      isLanguageEnabled: (lang) => isLangEnabled(cfg, lang),
      dailyCharLimit: cfg.translation.dailyCharLimit,
      onChange,
    });
    g.__hcEngine.set(payload, engine);
  }
  return engine;
}
