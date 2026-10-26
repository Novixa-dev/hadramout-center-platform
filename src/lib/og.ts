import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import sharp, { type OverlayOptions, type Sharp } from 'sharp';
import { resolveLegacyPath } from './legacy-media.ts';

/**
 * Branded social-preview cards (1200×630 PNG) for every page of the archive.
 *
 * Text is shaped by Pango (through sharp), which gets Arabic joining, bidi and mixed numerals right —
 * unlike Satori/`next/og`, which lays Arabic words out left-to-right. The font files ship in /public/fonts
 * (IBM Plex Sans Arabic, OFL) and are handed to Pango per call, so no system fonts are needed in the Docker image.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const BRAND = { green900: '#174438', green950: '#0b2a22', green700: '#226a5a', gold500: '#c49952', gold300: '#dbb775', gold100: '#f4e8cf', paper: '#fff8ec' };
const PAD = 72;

export interface OgInput {
  dir: 'rtl' | 'ltr';
  /** institution name (top line) */
  org: string;
  /** small gold label above the title, e.g. the content type */
  kicker?: string;
  title: string;
  /** author · date line under the title */
  meta?: string;
  /** raw image bytes of the cover/photo, when the page has one */
  cover?: Buffer | null;
  /** show the image framed beside the text instead of full-bleed (article illustrations often carry their own lettering) */
  frame?: boolean;
  /** host shown at the bottom, e.g. hadramout-center.novixa.dev */
  host: string;
}

const fontPath = (weight: 400 | 700) => resolve(process.cwd(), 'public/fonts', weight === 700 ? 'og-plex-700.ttf' : 'og-plex-400.ttf');
const markup = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface TextImg {
  input: Buffer;
  width: number;
  height: number;
}

async function textImg(text: string, o: { size: number; weight: 400 | 700; color: string; width: number; align: 'left' | 'right'; spacing?: number }): Promise<TextImg> {
  const font = `IBM Plex Sans Arabic ${o.weight === 700 ? 'Bold' : 'Regular'} ${o.size}`;
  const input = await sharp({
    text: { text: `<span foreground="${o.color}">${markup(text)}</span>`, font, fontfile: fontPath(o.weight), width: o.width, rgba: true, align: o.align, wrap: 'word', spacing: o.spacing ?? 0 },
  })
    .png()
    .toBuffer();
  const m = await sharp(input).metadata();
  return { input, width: m.width ?? 0, height: m.height ?? 0 };
}

/** Largest title size that fits the box; falls back to a word-boundary truncation. */
async function fitTitle(title: string, o: { width: number; maxHeight: number; align: 'left' | 'right'; color: string; leading: number }): Promise<TextImg> {
  let text = title.replace(/\s+/g, ' ').trim();
  if (text.length > 170) text = `${text.slice(0, 170).replace(/\s+\S*$/, '')}…`;
  for (const size of [66, 58, 52, 46, 42]) {
    const img = await textImg(text, { size, weight: 700, color: o.color, width: o.width, align: o.align, spacing: Math.round(size * o.leading) });
    if (img.height <= o.maxHeight) return img;
  }
  while (text.length > 20) {
    text = `${text.slice(0, Math.floor(text.length * 0.85)).replace(/\s+\S*$/, '')}…`;
    const img = await textImg(text, { size: 42, weight: 700, color: o.color, width: o.width, align: o.align, spacing: Math.round(42 * o.leading) });
    if (img.height <= o.maxHeight) return img;
  }
  return textImg(text, { size: 42, weight: 700, color: o.color, width: o.width, align: o.align, spacing: Math.round(42 * o.leading) });
}

function latticeSvg(opacity: number): string {
  // same diamond lattice as /brand/pattern.svg (the Center's mashrabiya motif)
  return `<pattern id="lat" width="44" height="44" patternUnits="userSpaceOnUse"><g fill="none" stroke="${BRAND.gold500}" stroke-width="1.3" opacity="${opacity}"><path d="M22 6 38 22 22 38 6 22Z"/><path d="M22 14 30 22 22 30 14 22Z"/><path d="M0 -10 10 0 0 10-10 0Z"/><path d="M44 -10 54 0 44 10 34 0Z"/><path d="M0 34 10 44 0 54-10 44Z"/><path d="M44 34 54 44 44 54 34 44Z"/></g></pattern>`;
}

function backgroundSvg(dir: 'rtl' | 'ltr', photo: boolean): Buffer {
  const edge = dir === 'rtl' ? OG_WIDTH - 14 : 0;
  const overlay = photo
    ? `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BRAND.green950}" stop-opacity="0.62"/><stop offset="0.2" stop-color="${BRAND.green950}" stop-opacity="0.08"/><stop offset="0.4" stop-color="${BRAND.green950}" stop-opacity="0.2"/><stop offset="0.54" stop-color="${BRAND.green950}" stop-opacity="0.62"/><stop offset="0.7" stop-color="${BRAND.green950}" stop-opacity="0.86"/><stop offset="1" stop-color="${BRAND.green950}" stop-opacity="0.97"/></linearGradient>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c5547"/><stop offset="1" stop-color="${BRAND.green950}"/></linearGradient>
${latticeSvg(photo ? 0.0 : 0.17)}
${overlay}
</defs>
${photo ? `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#fade)"/>` : `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#g)"/><rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#lat)"/>`}
<rect x="${edge}" y="0" width="14" height="${OG_HEIGHT}" fill="${BRAND.gold500}"/>
</svg>`;
  return Buffer.from(svg);
}

const roundedMask = (w: number, h: number, r: number) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);

let logoCache: Buffer | null = null;
function logo(): Promise<Buffer> {
  if (logoCache) return Promise.resolve(logoCache);
  return sharp(readFileSync(resolve(process.cwd(), 'public/brand/logo-icon.svg')), { density: 300 })
    .resize({ height: 104 })
    .png()
    .toBuffer()
    .then((b) => (logoCache = b));
}

type Layer = OverlayOptions;

export async function renderOgCard(input: OgInput): Promise<Buffer> {
  const rtl = input.dir === 'rtl';
  const align = rtl ? 'right' : 'left';
  const edgeStart = (w: number, x: number) => (rtl ? OG_WIDTH - x - w : x); // place a box of width w at inline-start offset x

  let coverMeta: { width: number; height: number } | null = null;
  if (input.cover) {
    try {
      const m = await sharp(input.cover).metadata();
      if (m.width && m.height) coverMeta = { width: m.width, height: m.height };
    } catch {
      input = { ...input, cover: null };
    }
  }
  const ratio = coverMeta ? coverMeta.height / coverMeta.width : 0;
  const portrait = Boolean(coverMeta && (ratio > 1.15 || input.frame)); // "portrait" = the image sits in a frame beside the text
  const photo = Boolean(coverMeta && !portrait);

  const layers: Layer[] = [];
  let base: Sharp;
  if (photo && input.cover) {
    base = sharp(input.cover).resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'attention' }).modulate({ brightness: 0.96, saturation: 1.05 }); // the photo stays sharp: only the top (header) and the bottom (title) are shaded
    layers.push({ input: backgroundSvg(input.dir, true) });
  } else {
    base = sharp({ create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 4, background: BRAND.green900 } });
    layers.push({ input: backgroundSvg(input.dir, false) });
  }

  // text column: full width, or narrowed beside a portrait cover
  // a book cover keeps its 2:3 frame; a framed landscape illustration gets a wider frame close to its own shape
  const coverW = ratio > 1.15 || !portrait ? 318 : 430;
  const coverH = ratio > 1.15 || !portrait ? 477 : Math.round(Math.min(477, Math.max(300, coverW * ratio)));
  const innerStart = PAD + 14;
  const colWidth = portrait ? OG_WIDTH - innerStart - PAD - coverW - 56 : OG_WIDTH - innerStart - PAD;

  // header: logo + institution name
  const mark = await logo();
  const markMeta = await sharp(mark).metadata();
  const markW = markMeta.width ?? 58;
  layers.push({ input: mark, left: edgeStart(markW, innerStart), top: 54 });
  // the header keeps the book-card width: a wider framed illustration starts below it
  const headerWidth = portrait ? OG_WIDTH - innerStart - PAD - 318 - 56 : colWidth;
  const org = await textImg(input.org, { size: 28, weight: 400, color: BRAND.gold100, width: headerWidth - markW - 24, align });
  const orgX = innerStart + markW + 24;
  layers.push({ input: org.input, left: rtl ? OG_WIDTH - orgX - org.width : orgX, top: 54 + Math.round((104 - org.height) / 2) });

  // footer: meta + host
  const footerTop = OG_HEIGHT - 76;
  let metaHeight = 0;
  if (input.meta) {
    const meta = await textImg(input.meta, { size: 28, weight: 400, color: BRAND.gold300, width: colWidth, align });
    metaHeight = meta.height;
    layers.push({ input: meta.input, left: rtl ? OG_WIDTH - innerStart - meta.width : innerStart, top: footerTop - meta.height + 8 });
  }
  const host = await textImg(input.host, { size: 24, weight: 400, color: '#9fc4b8', width: 500, align: rtl ? 'left' : 'right' });
  const hostX = portrait ? (rtl ? PAD + 6 : OG_WIDTH - PAD - 6 - host.width) : rtl ? PAD + 6 : OG_WIDTH - PAD - 6 - host.width;
  layers.push({ input: host.input, left: hostX, top: OG_HEIGHT - 58 });

  // kicker + title block, vertically placed between header and footer
  // over a photo the title block is confined to the lower part (two or three lines) so faces and subjects stay visible
  const top = photo ? 318 : 190;
  const bottom = OG_HEIGHT - 76 - (metaHeight ? metaHeight + 34 : 0);
  const kicker = input.kicker ? await textImg(input.kicker, { size: 30, weight: 700, color: BRAND.gold500, width: colWidth, align }) : null;
  const kickerBlock = kicker ? kicker.height + 18 : 0;
  const titleImg = await fitTitle(input.title, { width: colWidth, maxHeight: Math.max(160, bottom - top - kickerBlock), align, color: '#ffffff', leading: rtl ? 0.18 : -0.06 });
  const blockHeight = kickerBlock + titleImg.height;
  // over a photo the title sits at the bottom so the picture stays visible; beside a cover or on plain green it is centred
  let y = photo ? Math.max(top, bottom - blockHeight) : Math.max(top, Math.round((top + bottom - blockHeight) / 2) + 8);
  if (kicker) {
    layers.push({ input: kicker.input, left: rtl ? OG_WIDTH - innerStart - kicker.width : innerStart, top: y });
    y += kickerBlock;
  }
  layers.push({ input: titleImg.input, left: rtl ? OG_WIDTH - innerStart - titleImg.width : innerStart, top: y });

  // portrait cover (book / magazine issue), on the inline-end side
  if (portrait && input.cover) {
    const cover = await sharp(input.cover).resize(coverW, coverH, { fit: 'cover', position: ratio > 1.15 ? 'top' : 'attention' }).composite([{ input: roundedMask(coverW, coverH, 14), blend: 'dest-in' }]).png().toBuffer();
    const x = rtl ? PAD + 6 : OG_WIDTH - PAD - 6 - coverW;
    const cy = Math.round((OG_HEIGHT - coverH) / 2) - 6;
    layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${coverW + 24}" height="${coverH + 24}"><rect x="12" y="16" width="${coverW}" height="${coverH}" rx="16" fill="#000" opacity="0.38"/></svg>`), left: x - 12, top: cy - 8 });
    layers.push({ input: cover, left: x, top: cy });
  }

  return base.composite(layers).png({ compressionLevel: 9, palette: true, quality: 92, effort: 6 }).toBuffer();
}

// ── cover loading ─────────────────────────────────────────────────────────────────────────────

/** Read a page cover from our own storage (or the old site) into memory; null when unavailable. Never throws. */
export async function loadCoverBytes(src: string | null | undefined): Promise<Buffer | null> {
  if (!src) return null;
  try {
    if (src.startsWith('/legacy-media/')) {
      const target = resolveLegacyPath(src.slice('/legacy-media/'.length).split('/'));
      return target ? await readFile(target.file) : null;
    }
    if (src.startsWith('/api/media/file/')) {
      const name = decodeURIComponent(src.slice('/api/media/file/'.length).split('?')[0] ?? '');
      const dir = resolve(process.env.MEDIA_DIR || './data/media');
      const file = resolve(join(dir, name));
      if (!name || !file.startsWith(dir + sep)) return null;
      return await readFile(file);
    }
    if (/^https:\/\/(files\.hadramout\.center|i\.ytimg\.com)\//.test(src)) {
      const res = await fetch(src, { signal: AbortSignal.timeout(4000), redirect: 'error' });
      if (!res.ok || !/^image\//.test(res.headers.get('content-type') ?? '')) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length < 8 * 1024 * 1024 ? buf : null;
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** `src` of the first images inside an HTML body, in reading order (data: URIs and icons skipped). */
export function bodyImageSources(html: string | null | undefined, max = 2): string[] {
  const out: string[] = [];
  for (const m of (html ?? '').matchAll(/<img\b[^>]*?\ssrc=["']([^"']+)["']/gi)) {
    const src = m[1]!.trim();
    if (/^data:|\.svg(\?|$)|\/(emoji|icons?|smilies)\//i.test(src)) continue;
    out.push(src);
    if (out.length >= max) break;
  }
  return out;
}

/** A body image may illustrate a card when it is big enough to stay sharp and is not a divider strip or a tall scan. */
export async function cardWorthy(bytes: Buffer): Promise<boolean> {
  try {
    const { width = 0, height = 0 } = await sharp(bytes).metadata();
    const ratio = height / (width || 1);
    return width >= 480 && height >= 300 && ratio >= 0.4 && ratio <= 1.6;
  } catch {
    return false;
  }
}

/** The first card-worthy image of an article body (mirrored copy first, else the old host); null when there is none. */
export async function loadBodyPhoto(html: string | null | undefined): Promise<Buffer | null> {
  // three candidates: the first image is often an author thumbnail or a title strip, the photo comes next
  for (const src of bodyImageSources(html, 3)) {
    const local = src.replace(/^https?:\/\/files\.hadramout\.center\/media\//i, '/legacy-media/');
    const bytes = (await loadCoverBytes(local)) ?? (local !== src ? await loadCoverBytes(src) : null);
    if (bytes && (await cardWorthy(bytes))) return bytes;
  }
  return null;
}

// ── small LRU of rendered cards ───────────────────────────────────────────────────────────────
const lru = new Map<string, Buffer>();
export async function renderOgCached(key: string, make: () => Promise<Buffer>): Promise<Buffer> {
  const hit = lru.get(key);
  if (hit) {
    lru.delete(key);
    lru.set(key, hit);
    return hit;
  }
  const value = await make();
  lru.set(key, value);
  if (lru.size > 80) lru.delete(lru.keys().next().value as string);
  return value;
}

/** Scripts the bundled font can draw (Arabic + Latin + digits + punctuation); anything else would render as boxes. */
export function drawable(text: string): boolean {
  return !/[^\p{Script=Arabic}\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(text);
}
