import { loadConfig, type Config } from '../config.ts';

/** Config singleton that does not import Payload (safe to use inside collection hooks). */
const g = globalThis as { __hcConfig?: Config };

export function appConfig(): Config {
  g.__hcConfig ??= loadConfig();
  return g.__hcConfig;
}
