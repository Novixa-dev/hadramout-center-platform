import { loadConfig } from '../config.ts';
import { isProductionSite } from './site-env.ts';

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

/**
 * Dispatches an IndexNow ping for published URLs.
 * Automatically active only in production when INDEXNOW_KEY is configured.
 */
export async function notifyIndexNow(urls: string[]): Promise<boolean> {
  const cfg = loadConfig();
  const key = process.env.INDEXNOW_KEY;

  if (!isProductionSite() || !key || urls.length === 0) {
    return false;
  }

  const host = new URL(cfg.siteUrl).host;
  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation: `${cfg.siteUrl}/api/indexnow/key`,
    urlList: urls,
  };

  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return res.status >= 200 && res.status < 300;
  } catch (err) {
    console.warn('[indexnow] ping failed:', (err as Error).message);
    return false;
  }
}
