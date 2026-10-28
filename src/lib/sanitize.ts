import sanitizeHtml from 'sanitize-html';
import type { IOptions, Attributes } from 'sanitize-html';

/**
 * One strict allow-list used for EVERY piece of rich text that reaches the database
 * (legacy import and admin editor alike). Output is safe to inject with raw().
 */

const NBSP = String.fromCharCode(0xa0);
const YOUTUBE_HOSTS = ['www.youtube.com', 'www.youtube-nocookie.com', 'youtube.com'];

function transformIframe(tagName: string, attribs: Attributes) {
  let src = attribs.src ?? '';
  try {
    const u = new URL(src, 'https://www.youtube.com');
    if (YOUTUBE_HOSTS.includes(u.hostname) && u.pathname.startsWith('/embed/')) {
      src = `https://www.youtube-nocookie.com${u.pathname}`;
    }
  } catch {
    src = '';
  }
  return {
    tagName,
    attribs: {
      src,
      title: attribs.title ?? '',
      loading: 'lazy',
      allowfullscreen: 'true',
      referrerpolicy: 'strict-origin-when-cross-origin',
      allow: 'picture-in-picture; fullscreen',
    },
  };
}

const OPTIONS: IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'h2', 'h3', 'h4', 'h5', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small', 'cite', 'q', 'abbr',
    'blockquote', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'a', 'img', 'figure', 'figcaption', 'iframe',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'pre', 'code',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel', 'hreflang'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
    iframe: ['src', 'title', 'loading', 'allowfullscreen', 'referrerpolicy', 'allow'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    p: ['dir', 'lang'],
    li: ['dir', 'lang'],
    blockquote: ['dir', 'lang', 'cite'],
    '*': [],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'], iframe: ['https'] },
  allowProtocolRelative: false,
  allowedIframeHostnames: [...YOUTUBE_HOSTS],
  disallowedTagsMode: 'discard',
  transformTags: {
    h1: 'h2',
    b: 'strong',
    i: 'em',
    iframe: transformIframe,
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy', decoding: 'async' },
    }),
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const external = /^https?:\/\//i.test(href);
      const next: Attributes = { ...attribs };
      if (external) {
        next.target = '_blank';
        next.rel = 'noopener noreferrer';
      } else {
        delete next.target;
        delete next.rel;
      }
      return { tagName, attribs: next };
    },
  },
  textFilter: (text) => text.replaceAll(NBSP, ' ').replace(/[ \t]{2,}/g, ' '),
  exclusiveFilter: (frame) => {
    // Media whose URL was rejected by the scheme/host allow-lists must not survive as empty shells.
    if ((frame.tag === 'img' || frame.tag === 'iframe') && !frame.attribs.src) return true;
    return (frame.tag === 'p' || frame.tag === 'li' || frame.tag === 'blockquote') && !frame.text.trim() && frame.mediaChildren.length === 0;
  },
};

/** Sanitize untrusted rich text into the platform's safe subset. */
export function sanitizeBody(input: string): string {
  const clean = sanitizeHtml(input ?? '', OPTIONS);
  return clean
    .replace(/(?:<br\s*\/?>\s*){3,}/g, '<br /><br />')
    .replace(/<p>\s*<\/p>/g, '')
    .trim();
}

/** Strip every tag: titles, excerpts and other plain fields. */
export function sanitizeText(input: string): string {
  return sanitizeHtml(input ?? '', { allowedTags: [], allowedAttributes: {}, textFilter: (t) => t.replaceAll(NBSP, ' ') })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // last, or "&amp;lt;" (the literal text "&lt;") would be decoded twice into "<"
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain text of (sanitized) HTML with block boundaries turned into spaces. */
export function htmlToText(input: string): string {
  const spaced = (input ?? '').replace(/<\/(p|div|li|h[1-6]|tr|blockquote|figcaption)>|<br\s*\/?>/gi, ' ');
  return sanitizeText(spaced);
}

/** Short plain-text excerpt cut at a word boundary. */
export function excerptFrom(input: string, max = 220): string {
  const text = htmlToText(input);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trim()}…`;
}
