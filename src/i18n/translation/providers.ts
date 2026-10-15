import type { Config } from '../../config.ts';
import { decodeEntities, protectGlossary, relevantGlossary, unprotectGlossary } from './blocks.ts';
import { TranslationError, type TranslateRequest, type TranslateResult, type TranslationProvider } from './types.ts';
import { AnthropicProvider } from './anthropic.ts';

const joinGlossaryText = (texts: string[]) => texts.join('\n');

/** Deterministic fake used by tests and local development: tags every text node with ⟦lang⟧. */
export class MockProvider implements TranslationProvider {
  readonly name = 'mock';
  readonly model = 'mock-1';
  calls = 0;
  failNext = 0;

  async translate(req: TranslateRequest): Promise<TranslateResult> {
    this.calls++;
    if (this.failNext > 0) {
      this.failNext--;
      throw new TranslationError('mock failure', true);
    }
    const tag = `⟦${req.to}⟧`;
    const texts = req.texts.map((t) => (req.format === 'html' ? t.replace(/>([^<]+)</g, (_m, inner: string) => `>${tag} ${inner}<`).replace(/^([^<]+)</, `${tag} $1<`) : `${tag} ${t}`));
    return { texts, usage: { charsIn: req.texts.join('').length, charsOut: texts.join('').length }, model: this.model };
  }
}

async function fetchJson(url: string, init: RequestInit, label: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
  } catch (err) {
    throw new TranslationError(`${label}: network error ${(err as Error).message}`, true);
  }
  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 300);
    throw new TranslationError(`${label}: HTTP ${res.status} ${body}`, res.status === 429 || res.status >= 500);
  }
  return res.json();
}

/** Google Cloud Translation v2 (Basic). */
export class GoogleProvider implements TranslationProvider {
  readonly name = 'google';
  readonly model = 'google-nmt-v2';
  private readonly key: string;
  constructor(key: string) {
    this.key = key;
  }

  async translate(req: TranslateRequest): Promise<TranslateResult> {
    const glossary = relevantGlossary(req.glossary, joinGlossaryText(req.texts));
    const q = req.format === 'html' ? req.texts.map((t) => protectGlossary(t, glossary)) : req.texts;
    const target = req.to === 'zh' ? 'zh-CN' : req.to === 'zh-tw' ? 'zh-TW' : req.to === 'he' ? 'iw' : req.to;
    const data = (await fetchJson(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(this.key)}`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q, source: 'ar', target, format: req.format }) },
      'google',
    )) as { data?: { translations?: { translatedText: string }[] } };
    const out = data.data?.translations;
    if (!out || out.length !== q.length) throw new TranslationError('google: unexpected response shape', true);
    const texts = out.map((t) => (req.format === 'html' ? unprotectGlossary(t.translatedText) : decodeEntities(t.translatedText)));
    return { texts, usage: { charsIn: q.join('').length, charsOut: texts.join('').length }, model: this.model };
  }
}

/** Self-hosted LibreTranslate. */
export class LibreTranslateProvider implements TranslationProvider {
  readonly name = 'libretranslate';
  readonly model = 'libretranslate';
  private readonly url: string;
  private readonly key: string;
  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  async translate(req: TranslateRequest): Promise<TranslateResult> {
    const target = req.to === 'zh' ? 'zh-Hans' : req.to === 'zh-tw' ? 'zh-Hant' : req.to;
    const texts: string[] = [];
    for (const t of req.texts) {
      const data = (await fetchJson(
        `${this.url}/translate`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: t, source: 'ar', target, format: req.format, api_key: this.key || undefined }) },
        'libretranslate',
      )) as { translatedText?: string };
      if (typeof data.translatedText !== 'string') throw new TranslationError('libretranslate: unexpected response shape', true);
      texts.push(data.translatedText);
    }
    return { texts, usage: { charsIn: req.texts.join('').length, charsOut: texts.join('').length }, model: this.model };
  }
}

export function createProvider(config: Config): TranslationProvider | null {
  const t = config.translation;
  switch (t.provider) {
    case 'none':
      return null;
    case 'mock':
      return new MockProvider();
    case 'anthropic':
      return new AnthropicProvider({ apiKey: t.anthropicApiKey, model: t.model });
    case 'google':
      return new GoogleProvider(t.googleApiKey);
    case 'libretranslate':
      return new LibreTranslateProvider(t.libreUrl, t.libreApiKey);
  }
}
