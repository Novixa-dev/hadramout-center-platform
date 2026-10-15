import { parse } from 'node-html-parser';
import { createHash } from 'node:crypto';
import type { GlossaryEntry } from './types.ts';
import { normalizeArabic } from '../../lib/arabic.ts';

/** Stable short fingerprint of a source text (detects when the Arabic changed). */
export function hashText(text: string): string {
  return createHash('sha1').update(text).digest('hex').slice(0, 16);
}

/**
 * Split sanitized HTML into top-level blocks (<p>, <h2>, <ul>, <table>, …) so long
 * articles can be translated in small, tag-safe pieces and re-joined losslessly.
 */
export function splitHtmlBlocks(html: string): string[] {
  const root = parse(html, { comment: false });
  const blocks: string[] = [];
  let loose = '';
  for (const node of root.childNodes) {
    const isElement = 'tagName' in node && node.nodeType === 1;
    if (isElement) {
      if (loose.trim()) blocks.push(loose);
      loose = '';
      blocks.push(node.toString());
    } else {
      loose += node.toString();
    }
  }
  if (loose.trim()) blocks.push(loose);
  return blocks;
}

/** Group blocks into batches whose total size stays under `maxChars` (a block is never split). */
export function batchBlocks(blocks: string[], maxChars = 5500): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const block of blocks) {
    if (current.length > 0 && size + block.length > maxChars) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(block);
    size += block.length;
  }
  if (current.length) batches.push(current);
  return batches;
}

/** Sorted list of tag names in an HTML fragment — a translation must not add, drop or change tags. */
export function tagSignature(html: string): string {
  const tags = [...html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b/g)].map((m) => (m[0].startsWith('</') ? `/${m[1]}` : (m[1] as string)).toLowerCase());
  return tags.sort().join(',');
}

export function sameStructure(sourceHtml: string, translatedHtml: string): boolean {
  return tagSignature(sourceHtml) === tagSignature(translatedHtml);
}

/** Glossary entries whose Arabic term actually occurs in `text` (keeps prompts small). */
export function relevantGlossary(entries: GlossaryEntry[], text: string): GlossaryEntry[] {
  const hay = normalizeArabic(text);
  return entries.filter((e) => hay.includes(normalizeArabic(e.termAr)));
}

/**
 * For engines that cannot take a glossary (Google/LibreTranslate): replace each Arabic term
 * with its canonical form wrapped in translate="no" so the engine leaves it untouched.
 * Longest terms first so "وادي حضرموت" wins over "حضرموت".
 */
export function protectGlossary(html: string, entries: GlossaryEntry[]): string {
  let out = html;
  for (const e of [...entries].sort((a, b) => b.termAr.length - a.termAr.length)) {
    if (!e.termAr || !e.translation) continue;
    const escapedTerm = e.termAr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escapedTerm, 'g'), `<span translate="no" class="notranslate">${e.translation}</span>`);
  }
  return out;
}

export function unprotectGlossary(html: string): string {
  return html.replace(/<span[^>]*translate="no"[^>]*>(.*?)<\/span>/g, '$1');
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&nbsp;': ' ' };

/** Decode the few entities translation engines add to plain-text responses. */
export function decodeEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|nbsp|#39|#x27);/g, (m) => ENTITIES[m] ?? m).replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}

/** Protect {placeholders} in UI strings by swapping them for opaque tokens the model will not alter. */
export function maskPlaceholders(text: string): { masked: string; tokens: string[] } {
  const tokens: string[] = [];
  const masked = text.replace(/\{\w+\}/g, (m) => {
    tokens.push(m);
    return `⟦${tokens.length - 1}⟧`;
  });
  return { masked, tokens };
}

export function unmaskPlaceholders(text: string, tokens: string[]): string {
  return text.replace(/⟦\s*(\d+)\s*⟧/g, (m, i: string) => tokens[Number(i)] ?? m);
}
