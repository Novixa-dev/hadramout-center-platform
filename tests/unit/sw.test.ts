import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/**
 * Runs public/sw.js in a sandbox with fake `caches`, `fetch` and events, so the rules that keep the site safe
 * (never serve stale pages while online, only saved pages offline, bounded storage) are tested without a browser.
 */
const source = readFileSync('public/sw.js', 'utf8');
const ORIGIN = 'https://example.org';

class FakeResponse {
  readonly body: string;
  readonly status: number;
  readonly ok: boolean;
  readonly headers: { get: (n: string) => string | null };
  constructor(body: string, init: { status?: number; headers?: Record<string, string> } = {}) {
    this.body = body;
    this.status = init.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
    const h = Object.fromEntries(Object.entries(init.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    this.headers = { get: (n) => h[n.toLowerCase()] ?? null };
  }
  clone() {
    return this;
  }
}

const norm = (k: unknown): string => {
  const raw = typeof k === 'string' ? k : (k as { url: string }).url;
  const u = new URL(raw, ORIGIN);
  return u.pathname + u.search;
};

class FakeCache {
  readonly map = new Map<string, FakeResponse>();
  async match(k: unknown) {
    return this.map.get(norm(k));
  }
  async put(k: unknown, r: FakeResponse) {
    this.map.delete(norm(k));
    this.map.set(norm(k), r);
  }
  async add(k: string) {
    this.map.set(norm(k), new FakeResponse(`static:${k}`, { headers: { 'content-type': 'text/html' } }));
  }
  async delete(k: unknown) {
    return this.map.delete(norm(k));
  }
  async keys() {
    return [...this.map.keys()].map((url) => ({ url }));
  }
}

type Listener = (e: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

function boot() {
  const listeners = new Map<string, Listener>();
  const stores = new Map<string, FakeCache>();
  const fetched: string[] = [];
  let network: (url: string) => Promise<FakeResponse> = async (url) => new FakeResponse(`net:${url}`, { headers: { 'content-type': 'text/html' } });
  const sandbox = {
    self: {
      location: { origin: ORIGIN },
      addEventListener: (t: string, fn: Listener) => listeners.set(t, fn),
      skipWaiting: async () => undefined,
      clients: { claim: async () => undefined },
    },
    caches: {
      open: async (n: string) => (stores.get(n) ?? stores.set(n, new FakeCache()).get(n)!),
      keys: async () => [...stores.keys()],
      delete: async (n: string) => stores.delete(n),
    },
    fetch: async (r: unknown) => {
      const url = norm(r);
      fetched.push(url);
      return network(url);
    },
    Response: FakeResponse,
    URL,
  };
  vm.runInNewContext(source, sandbox);

  const dispatch = async (type: string, event: Record<string, unknown>) => {
    const waits: Promise<unknown>[] = [];
    const e = { ...event, waits, waitUntil: (p: Promise<unknown>) => waits.push(p), respondWith(p: Promise<unknown>) { (e as { response?: Promise<unknown> }).response = p; } };
    listeners.get(type)!(e);
    const response = await (e as { response?: Promise<FakeResponse> }).response;
    await Promise.all(waits);
    return { response, intercepted: Boolean((e as { response?: unknown }).response) };
  };
  return {
    stores,
    fetched,
    setNetwork: (fn: typeof network) => (network = fn),
    offline: () => (network = async () => { throw new TypeError('Failed to fetch'); }),
    install: () => dispatch('install', {}),
    activate: () => dispatch('activate', {}),
    navigate: (path: string) => dispatch('fetch', { request: { method: 'GET', mode: 'navigate', url: ORIGIN + path } }),
    request: (path: string, init: { method?: string; mode?: string; origin?: string } = {}) => dispatch('fetch', { request: { method: init.method ?? 'GET', mode: init.mode ?? 'no-cors', url: (init.origin ?? ORIGIN) + path } }),
    message: (data: unknown) => dispatch('message', { data }),
  };
}

describe('service worker (public/sw.js)', () => {
  let sw: ReturnType<typeof boot>;
  beforeEach(async () => {
    sw = boot();
    await sw.install();
  });

  test('install precaches only the offline page', async () => {
    assert.deepEqual([...sw.stores.get('hc-static-v1')!.map.keys()], ['/offline.html']);
  });

  test('only same-origin GET navigations and immutable build files are intercepted', async () => {
    assert.equal((await sw.request('/api/news', { mode: 'cors' })).intercepted, false, 'API');
    assert.equal((await sw.request('/legacy-media/a.jpg')).intercepted, false, 'images');
    assert.equal((await sw.request('/ar', { method: 'POST', mode: 'navigate' })).intercepted, false, 'POST');
    assert.equal((await sw.request('/ar', { mode: 'navigate', origin: 'https://other.example' })).intercepted, false, 'cross-origin');
    assert.equal((await sw.request('/_next/static/chunks/a.css')).intercepted, true, 'hashed build file');
  });

  test('online navigation always comes from the network and ordinary pages are never stored', async () => {
    const { response } = await sw.navigate('/ar/articles/1');
    assert.equal(response!.body, 'net:/ar/articles/1');
    assert.equal(sw.stores.get('hc-saved-v1')?.map.size ?? 0, 0);
  });

  test('offline: a saved page is served from its copy', async () => {
    await sw.message({ type: 'save', url: '/ar/articles/1' });
    sw.offline();
    const { response } = await sw.navigate('/ar/articles/1');
    assert.equal(response!.body, 'net:/ar/articles/1');
  });

  test('offline: an unsaved page gets the offline page, and a missing offline page degrades to a plain 503', async () => {
    sw.offline();
    assert.equal((await sw.navigate('/ar/articles/2')).response!.body, 'static:/offline.html');
    sw.stores.get('hc-static-v1')!.map.clear();
    const bare = (await sw.navigate('/ar/articles/2')).response!;
    assert.equal(bare.status, 503);
  });

  test('saving stores HTML only; non-HTML, failed and cross-origin saves are ignored', async () => {
    sw.setNetwork(async () => new FakeResponse('%PDF', { headers: { 'content-type': 'application/pdf' } }));
    await sw.message({ type: 'save', url: '/ar/articles/1' });
    sw.setNetwork(async () => new FakeResponse('nope', { status: 500, headers: { 'content-type': 'text/html' } }));
    await sw.message({ type: 'save', url: '/ar/articles/2' });
    await sw.message({ type: 'save', url: 'https://evil.example/ar/articles/3' });
    await sw.message({ type: 'save', url: 12345 });
    await sw.message({ type: 'save' });
    assert.equal(sw.stores.get('hc-saved-v1')?.map.size ?? 0, 0);
    assert.deepEqual(sw.fetched.filter((u) => u.includes('evil')), [], 'no request is made for another origin');
  });

  test('removing a saved page deletes its copy', async () => {
    await sw.message({ type: 'save', url: '/ar/articles/1' });
    assert.equal(sw.stores.get('hc-saved-v1')!.map.size, 1);
    await sw.message({ type: 'unsave', url: '/ar/articles/1' });
    assert.equal(sw.stores.get('hc-saved-v1')!.map.size, 0);
  });

  test('visiting a saved page online refreshes its copy; visiting an unsaved page does not create one', async () => {
    await sw.message({ type: 'save', url: '/ar/articles/1' });
    sw.setNetwork(async (u) => new FakeResponse(`v2:${u}`, { headers: { 'content-type': 'text/html' } }));
    await sw.navigate('/ar/articles/1');
    await sw.navigate('/ar/articles/9');
    const saved = sw.stores.get('hc-saved-v1')!;
    assert.equal((await saved.match('/ar/articles/1'))!.body, 'v2:/ar/articles/1');
    assert.equal(saved.map.has('/ar/articles/9'), false);
  });

  test('build files are cache-first: the second request does not touch the network', async () => {
    await sw.request('/_next/static/chunks/a.css');
    const before = sw.fetched.length;
    const again = await sw.request('/_next/static/chunks/a.css');
    assert.equal(sw.fetched.length, before);
    assert.equal(again.response!.body, 'net:/_next/static/chunks/a.css');
  });

  test('activation removes caches of older versions and keeps the current ones and other sites’ caches', async () => {
    await caches_open(sw, 'hc-static-v0');
    await caches_open(sw, 'hc-saved-v0');
    await caches_open(sw, 'other-app');
    await sw.activate();
    assert.deepEqual([...sw.stores.keys()].sort(), ['hc-static-v1', 'other-app']);
  });

  test('storage is bounded: at most 60 saved pages are kept, oldest first', async () => {
    for (let i = 1; i <= 62; i++) await sw.message({ type: 'save', url: `/ar/articles/${i}` });
    const saved = sw.stores.get('hc-saved-v1')!;
    assert.equal(saved.map.size, 60);
    assert.equal(saved.map.has('/ar/articles/1'), false);
    assert.equal(saved.map.has('/ar/articles/62'), true);
  });
});

async function caches_open(sw: ReturnType<typeof boot>, name: string) {
  sw.stores.set(name, new FakeCache());
}
