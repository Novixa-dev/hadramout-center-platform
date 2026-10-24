/**
 * Tiny HTML templating with escaping by default.
 *
 *   html`<h1>${title}</h1>`        // `title` is escaped
 *   html`<div>${raw(bodyHtml)}</div>` // explicitly trusted (already sanitized) markup
 *
 * Rules: always wrap attribute values in double quotes; interpolated values are
 * escaped for both text and quoted-attribute contexts.
 */

export class SafeHtml {
  readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
  toString(): string {
    return this.value;
  }
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c] as string);
}

/** Mark a string as already-safe markup. Only use on sanitized or constant HTML. */
export function raw(value: string): SafeHtml {
  return new SafeHtml(value);
}

export type Renderable = SafeHtml | string | number | bigint | boolean | null | undefined | Renderable[];

function render(value: Renderable): string {
  if (value === null || value === undefined || value === false || value === true) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return esc(value);
}

export function html(strings: TemplateStringsArray, ...values: Renderable[]): SafeHtml {
  let out = strings[0] as string;
  for (let i = 0; i < values.length; i++) {
    out += render(values[i] as Renderable) + (strings[i + 1] as string);
  }
  return new SafeHtml(out);
}

/** Build a space-separated class string from truthy entries. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Render boolean/valued attributes safely: attrs({ href: '/x', hidden: true, 'data-id': 3 }). */
export function attrs(map: Record<string, string | number | boolean | null | undefined>): SafeHtml {
  const out: string[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (v === false || v === null || v === undefined) continue;
    if (!/^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/.test(k)) throw new Error(`Unsafe attribute name: ${k}`);
    out.push(v === true ? k : `${k}="${esc(v)}"`);
  }
  return new SafeHtml(out.length ? ` ${out.join(' ')}` : '');
}

/** Safe JSON for embedding inside <script type="application/ld+json"> or data blocks. */
export function jsonForScript(data: unknown): SafeHtml {
  return new SafeHtml(JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'));
}
