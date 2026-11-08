import { localizeLegacyMedia } from './legacy-media.ts';

/**
 * A link an editor typed (registration page, audio stream, partner website): only http(s) and site-relative paths are
 * rendered, so `javascript:` or `data:` text can never become a clickable link.
 */
export function safeHref(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/** URL of an upload relation populated at depth ≥ 1 (null when unpopulated or missing). */
export function mediaUrl(ref: unknown): string | null {
  if (!ref || typeof ref !== 'object') return null;
  const url = (ref as { url?: unknown }).url;
  return typeof url === 'string' && url ? localizeLegacyMedia(url) : null;
}

/** The YouTube video id in a watch/short/embed/youtu.be link or a bare 11-character id; null for anything else. */
export function youtubeId(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  try {
    const u = new URL(v);
    const host = u.hostname.replace(/^(www\.|m\.)/, '');
    if (host === 'youtu.be') return /^[\w-]{11}$/.test(u.pathname.slice(1)) ? u.pathname.slice(1) : null;
    if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null;
    const id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] ?? null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** A direct audio file the browser can play inline (by extension); other links open on their own platform. */
export const isAudioFile = (url: string): boolean => /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac)(\?|#|$)/i.test(url);
