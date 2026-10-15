import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LEGACY_BASE,
  SECTIONS,
  listingIds,
  makeDateEstimator,
  parseDetail,
  type PostType,
  type SnapshotPost,
} from './legacy.ts';

export interface CrawlOptions {
  cacheDir: string;
  types?: PostType[];
  limit?: number;
  refresh?: boolean;
  /** reuse cached listing pages too (re-parse without touching the network) */
  offline?: boolean;
  concurrency?: number;
  delayMs?: number;
  log?: (msg: string) => void;
}

export interface Snapshot {
  meta: {
    source: string;
    generatedAt: string;
    tool: string;
    discovered: Record<string, number>;
    imported: Record<string, number>;
  };
  posts: SnapshotPost[];
}

export interface CrawlReport {
  discovered: Record<string, number>;
  imported: Record<string, number>;
  failed: { type: PostType; id: number; reason: string }[];
  warnings: { type: PostType; id: number; message: string }[];
  extraLabels: Record<string, number>;
  missingYearBooks: number;
}

const ALL_TYPES = Object.keys(SECTIONS) as PostType[];
const UA = 'HadramoutCenter-Migration/2.0 (+https://novixa.dev; content migration for the Center itself)';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class Fetcher {
  private readonly cacheDir: string;
  private readonly refresh: boolean;
  private readonly delayMs: number;

  constructor(cacheDir: string, refresh: boolean, delayMs: number) {
    this.cacheDir = cacheDir;
    this.refresh = refresh;
    this.delayMs = delayMs;
    mkdirSync(cacheDir, { recursive: true });
  }

  private cachePath(url: string): string {
    return join(this.cacheDir, `${createHash('sha1').update(url).digest('hex').slice(0, 20)}.html`);
  }

  async get(url: string, useCache = true): Promise<string> {
    const path = this.cachePath(url);
    if (useCache && !this.refresh && existsSync(path)) return readFileSync(path, 'utf8');
    let lastErr: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: AbortSignal.timeout(30_000) });
        if (res.status === 404) return '';
        if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.text();
        writeFileSync(path, body);
        await sleep(this.delayMs);
        return body;
      } catch (err) {
        lastErr = err;
        await sleep(500 * 2 ** attempt);
      }
    }
    throw new Error(`Failed to fetch ${url}: ${(lastErr as Error)?.message ?? lastErr}`);
  }
}

async function pool<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i] as T);
      }
    }),
  );
  return results;
}

/** Walk the paginated listings of one section until a page adds nothing new. */
export async function discoverIds(fetcher: Fetcher, type: PostType, maxPages = 120, offline = false): Promise<number[]> {
  const section = SECTIONS[type];
  const seen = new Set<number>();
  for (let page = 1; page <= maxPages; page++) {
    const html = await fetcher.get(`${LEGACY_BASE}/${section}?page=${page}`, offline);
    const ids = listingIds(section, html);
    const before = seen.size;
    ids.forEach((id) => seen.add(id));
    if (ids.length === 0 || seen.size === before) break;
  }
  return [...seen];
}

export async function crawlLegacy(opts: CrawlOptions): Promise<{ snapshot: Snapshot; report: CrawlReport }> {
  const log = opts.log ?? (() => {});
  const fetcher = new Fetcher(opts.cacheDir, opts.refresh ?? false, opts.delayMs ?? 150);
  const types = opts.types?.length ? opts.types : ALL_TYPES;
  const report: CrawlReport = { discovered: {}, imported: {}, failed: [], warnings: [], extraLabels: {}, missingYearBooks: 0 };
  const posts: SnapshotPost[] = [];

  for (const type of types) {
    let ids = await discoverIds(fetcher, type, 120, opts.offline ?? false);
    report.discovered[type] = ids.length;
    log(`• ${type}: discovered ${ids.length} items`);
    if (opts.limit) ids = ids.slice(0, opts.limit);

    let done = 0;
    const parsed = await pool(ids, opts.concurrency ?? 4, async (id) => {
      try {
        const html = await fetcher.get(`${LEGACY_BASE}/${SECTIONS[type]}/${id}`);
        const result = parseDetail(type, id, html);
        done++;
        if (done % 50 === 0) log(`  … ${type} ${done}/${ids.length}`);
        return { id, result };
      } catch (err) {
        report.failed.push({ type, id, reason: (err as Error).message });
        return { id, result: null };
      }
    });

    for (const { id, result } of parsed) {
      if (!result) continue;
      for (const message of result.warnings) report.warnings.push({ type, id, message });
      if (!result.post) {
        report.failed.push({ type, id, reason: result.warnings.join('; ') || 'empty page' });
        continue;
      }
      posts.push(result.post);
    }
    report.imported[type] = posts.filter((p) => p.type === type).length;
  }

  applyDateEstimates(posts);

  for (const p of posts) {
    const extra = p.data.legacy_extra as Record<string, string> | undefined;
    if (extra) for (const k of Object.keys(extra)) report.extraLabels[k] = (report.extraLabels[k] ?? 0) + 1;
    if (p.type === 'book' && p.data.year === undefined) report.missingYearBooks++;
  }

  posts.sort((a, b) => a.type.localeCompare(b.type) || a.id - b.id);
  const snapshot: Snapshot = {
    meta: {
      source: LEGACY_BASE,
      generatedAt: new Date().toISOString(),
      tool: 'import-legacy@2',
      discovered: report.discovered,
      imported: report.imported,
    },
    posts,
  };
  return { snapshot, report };
}

/** Give undated items a sortable date: issue date for articles, id-interpolation for the rest. */
export function applyDateEstimates(posts: SnapshotPost[]): void {
  const dated = posts.filter((p) => p.type === 'news' && p.publishedAt && p.datePrecision === 'day').map((p) => ({ id: p.id, date: p.publishedAt as string }));
  const estimate = makeDateEstimator(dated);
  const magazines = new Map(posts.filter((p) => p.type === 'magazine').map((p) => [p.id, p]));

  for (const p of posts) {
    if (p.publishedAt) continue;
    if (p.type === 'article') {
      const issue = magazines.get(Number(p.data.magazine_id));
      if (issue?.publishedAt) {
        p.publishedAt = issue.publishedAt;
        p.datePrecision = 'month';
        p.data.date_source = 'issue';
        continue;
      }
    }
    const est = estimate(p.id);
    if (est) {
      p.publishedAt = est;
      p.datePrecision = 'estimated';
      p.data.date_source = 'id-interpolation';
    }
  }
}
