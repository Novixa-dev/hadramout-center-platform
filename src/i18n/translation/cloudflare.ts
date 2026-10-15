import { TranslationError, type TranslateRequest, type TranslateResult, type TranslationProvider } from './types.ts';
import { buildSystemPrompt, parseSegments } from './anthropic.ts';

/**
 * Cloudflare Workers AI — free tier (10,000 "neurons" per day, no card needed). Uses an instruction-tuned model
 * (default Mistral Small 3.1 24B, strong on Arabic) with the same prompt/segment-marker protocol as the other LLM provider,
 * so HTML structure, glossary and the tag guard keep working.
 * Docs: https://developers.cloudflare.com/workers-ai/platform/pricing/
 */
export interface CloudflareProviderOptions {
  accountId: string;
  apiToken: string;
  model: string;
  fetchImpl?: typeof fetch;
}

interface CfResponse {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
  result?: { response?: string; choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
}

export class CloudflareProvider implements TranslationProvider {
  readonly name = 'cloudflare';
  readonly model: string;
  private readonly o: CloudflareProviderOptions;

  constructor(opts: CloudflareProviderOptions) {
    this.o = opts;
    this.model = opts.model;
  }

  async translate(req: TranslateRequest): Promise<TranslateResult> {
    const charsIn = req.texts.join('').length;
    const user = req.texts.map((t, i) => `@@@${i + 1}@@@\n${t}`).join('\n');
    const maxTokens = Math.min(8192, Math.max(1024, Math.ceil(charsIn * 0.8) + 600));
    const doFetch = this.o.fetchImpl ?? fetch;

    let res: Response;
    try {
      res = await doFetch(`https://api.cloudflare.com/client/v4/accounts/${this.o.accountId}/ai/run/${this.o.model}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.o.apiToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: buildSystemPrompt(req) }, { role: 'user', content: user }], max_tokens: maxTokens, temperature: 0.1 }),
        signal: AbortSignal.timeout(120_000),
      });
    } catch (err) {
      throw new TranslationError(`cloudflare: network error ${(err as Error).message}`, true);
    }

    const data = (await res.json().catch(() => ({}))) as CfResponse;
    if (!res.ok || data.success === false) {
      const msg = data.errors?.map((e) => `${e.code ?? ''} ${e.message ?? ''}`).join('; ') || `HTTP ${res.status}`;
      // 4006 = daily free allocation used up (resets at 00:00 UTC): worth retrying later, not a permanent failure
      const retryable = res.status === 429 || res.status >= 500 || data.errors?.some((e) => e.code === 4006) === true;
      throw new TranslationError(`cloudflare: ${msg}`, retryable);
    }

    const text = data.result?.response ?? data.result?.choices?.[0]?.message?.content ?? '';
    const texts = parseSegments(text, req.texts.length);
    if (!texts) throw new TranslationError('cloudflare: segment markers missing or reordered', true);
    return {
      texts,
      model: this.model,
      usage: { charsIn, charsOut: texts.join('').length, tokensIn: data.result?.usage?.prompt_tokens, tokensOut: data.result?.usage?.completion_tokens },
    };
  }
}
