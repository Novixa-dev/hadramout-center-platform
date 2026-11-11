import sharp from 'sharp';

/**
 * Every receipt photo is decoded and written again as a plain JPEG before it is stored. That turns the visitor's file into pixels
 * only: no script, no second file hidden after the image, and none of the metadata phones add (GPS position, device, owner name).
 * sharp drops metadata unless asked to keep it. `rotate()` applies the EXIF orientation first, so the photo stays upright.
 */
export const RECEIPT_MAX_SIDE = 2400;
/**
 * A 48-megapixel phone photo still fits; beyond that a small file can unpack into hundreds of megabytes (a 16-bit PNG), and the
 * container has 1 GB. The header is read first, so such a file is refused before any decoding.
 */
export const RECEIPT_MAX_PIXELS = 50_000_000;

export type Normalized = Buffer | 'large' | null;

export async function normalizeReceipt(input: Buffer): Promise<Normalized> {
  try {
    const { width = 0, height = 0 } = await sharp(input).metadata();
    if (!width || !height) return null;
    if (width * height > RECEIPT_MAX_PIXELS) return 'large';
    return await sharp(input, { limitInputPixels: RECEIPT_MAX_PIXELS, failOn: 'error', animated: false })
      .rotate()
      .resize({ width: RECEIPT_MAX_SIDE, height: RECEIPT_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    return null;
  }
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs receipt work one at a time in this process: one large decode at a time keeps memory bounded, and the per-request receipt
 * count checked inside cannot be raced by parallel uploads.
 */
export function oneAtATime<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.catch(() => undefined);
  return run;
}
