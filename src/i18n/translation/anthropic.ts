import Anthropic from '@anthropic-ai/sdk';
import { TranslationError, type TranslateRequest, type TranslateResult, type TranslationProvider } from './types.ts';

/** Minimal surface of the SDK we use — lets tests inject a fake without network access. */
export interface MessagesClient {
  create(params: Record<string, unknown>): Promise<{
    content: { type: string; text?: string }[];
    stop_reason: string | null;
    usage?: { input_tokens: number; output_tokens: number };
  }>;
}

export interface AnthropicProviderOptions {
  apiKey: string;
  model: string;
  client?: MessagesClient;
}

const SUPPORTS_EFFORT = /^claude-(?:fable|opus|sonnet|haiku)-5|^claude-(?:opus|sonnet)-4-[678]/;
const SUPPORTS_FALLBACKS = /^claude-(?:fable-5-1|opus-5(?:-5)?|sonnet-5-5)$/;

const MARKER = /^@@@(\d+)@@@[ \t]*$/m;

export function buildSystemPrompt(req: TranslateRequest): string {
  const glossary = req.glossary.length
    ? `\nGLOSSARY — use these renderings exactly (Arabic => ${req.toName}/canonical spelling):\n${req.glossary.map((g) => `${g.termAr} => ${g.translation}${g.kind === 'keep' ? ' (do not translate)' : ''}`).join('\n')}\n`
    : '';
  return [
    `You are a professional translator for a scholarly institution (the Hadhramout Center for Historical Studies, Documentation and Publishing in Mukalla, Yemen).`,
    `Translate Arabic into ${req.toName} (language code "${req.to}"). Content type: ${req.context ?? 'historical and cultural scholarship'}.`,
    ``,
    `Rules:`,
    `1. Be faithful: preserve meaning, register and structure. Neutral academic tone. Never add, omit, summarize or comment.`,
    req.format === 'html'
      ? `2. Each segment is an HTML fragment. Keep every tag, attribute, URL and entity exactly as is; translate only the human-readable text between tags.`
      : `2. Each segment is plain text. Keep any ⟦n⟧ tokens exactly as they are.`,
    `3. Quranic verses and hadith: keep the Arabic text unchanged and add the translated meaning in parentheses.`,
    `4. People and place names: use the glossary form when listed; otherwise a standard scholarly transliteration (or the conventional spelling in ${req.toName}). Keep academic titles (Dr., Prof.) in their ${req.toName} convention.`,
    `5. Keep numerals as Latin digits (0-9) and keep dates as written (Hijri stays Hijri).`,
    `6. If a segment is already in ${req.toName} or has no translatable text, return it unchanged.`,
    `7. Output format: for every input segment output a line "@@@N@@@" (the same N) followed by the translation, in the same order, and nothing else — no preface, no notes.`,
    glossary,
  ].join('\n');
}

export function parseSegments(output: string, expected: number): string[] | null {
  const parts = output.split(new RegExp(MARKER.source, 'gm'));
  // split() with one capture group → [before, n1, text1, n2, text2, …]
  const result: string[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const index = Number(parts[i]);
    result[index - 1] = (parts[i + 1] ?? '').replace(/^\r?\n/, '').replace(/\s+$/, '');
  }
  if (result.length !== expected || result.some((r) => r === undefined)) return null;
  return result;
}

export class AnthropicProvider implements TranslationProvider {
  readonly name = 'anthropic';
  readonly model: string;
  private readonly client: MessagesClient;

  constructor(opts: AnthropicProviderOptions) {
    this.model = opts.model;
    if (opts.client) {
      this.client = opts.client;
    } else {
      const sdk = new Anthropic({ apiKey: opts.apiKey, maxRetries: 3, timeout: 120_000 });
      this.client = { create: (params) => sdk.beta.messages.create(params as never) as never };
    }
  }

  async translate(req: TranslateRequest): Promise<TranslateResult> {
    const charsIn = req.texts.join('').length;
    const user = req.texts.map((t, i) => `@@@${i + 1}@@@\n${t}`).join('\n');
    // Arabic → Latin output is ~1.1–1.6x the input length in tokens; leave headroom for thinking.
    const maxTokens = Math.min(16_000, Math.max(2048, Math.ceil(charsIn * 0.9) + 1500));

    const params: Record<string, unknown> = {
      model: this.model,
      max_tokens: maxTokens,
      system: buildSystemPrompt(req),
      messages: [{ role: 'user', content: user }],
    };
    if (SUPPORTS_EFFORT.test(this.model)) params.output_config = { effort: 'low' };
    if (SUPPORTS_FALLBACKS.test(this.model)) {
      params.betas = ['server-side-fallback-2026-07-01'];
      params.fallbacks = 'default';
    }

    let response: Awaited<ReturnType<MessagesClient['create']>>;
    try {
      response = await this.client.create(params);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.APIConnectionError || err instanceof Anthropic.InternalServerError) {
        throw new TranslationError(`anthropic: ${(err as Error).message}`, true);
      }
      if (err instanceof Anthropic.APIError) {
        throw new TranslationError(`anthropic: ${err.status} ${err.message}`, (err.status ?? 0) >= 500 || err.status === 429);
      }
      throw new TranslationError(`anthropic: ${(err as Error).message}`, true);
    }

    if (response.stop_reason === 'refusal') throw new TranslationError('anthropic: the model declined this text', false);
    if (response.stop_reason === 'max_tokens') throw new TranslationError('anthropic: output truncated (batch too large)', false);

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');
    const texts = parseSegments(text, req.texts.length);
    if (!texts) throw new TranslationError('anthropic: segment markers missing or reordered', true);
    return {
      texts,
      model: this.model,
      usage: { charsIn, charsOut: texts.join('').length, tokensIn: response.usage?.input_tokens, tokensOut: response.usage?.output_tokens },
    };
  }
}
