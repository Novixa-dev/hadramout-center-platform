export interface GlossaryEntry {
  termAr: string;
  /** canonical rendering in the target language (or canonical Latin spelling when from the 'en' list) */
  translation: string;
  kind: 'term' | 'person' | 'place' | 'org' | 'keep';
}

export interface TranslateRequest {
  /** segments to translate, in order */
  texts: string[];
  format: 'text' | 'html';
  /** target language code (catalog code, e.g. "fr", "zh-tw") */
  to: string;
  /** English name of the target language (for prompts) */
  toName: string;
  glossary: GlossaryEntry[];
  /** what the text is: "historical study", "news report", "UI strings"... */
  context?: string;
}

export interface TranslateResult {
  texts: string[];
  usage: { charsIn: number; charsOut: number; tokensIn?: number; tokensOut?: number };
  model?: string;
}

export interface TranslationProvider {
  readonly name: string;
  /** model/engine label stored next to each translation */
  readonly model: string;
  translate(req: TranslateRequest): Promise<TranslateResult>;
}

export class TranslationError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'TranslationError';
    this.retryable = retryable;
  }
}
