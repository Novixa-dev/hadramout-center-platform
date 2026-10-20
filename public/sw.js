/* Hadhramout Center service worker — conservative by design.
 *
 *  - installs one static offline page;
 *  - page navigations always go to the network first; a cached copy is served ONLY when the network fails,
 *    and only for pages the reader saved (plus the offline page), so no ordinary page can ever be served stale;
 *  - a saved page's copy is refreshed whenever it is visited online;
 *  - content-hashed build files and fonts are cached on first use (their URLs change when their content does),
 *    so a saved article still has its styles and fonts offline;
 *  - API calls, images, PDFs and everything else are untouched.
 */
const VERSION = 'v1';
const STATIC = 'hc-static-' + VERSION;
const SAVED = 'hc-saved-' + VERSION;
const OFFLINE = '/offline.html';
const MAX_SAVED_PAGES = 60;
const MAX_STATIC_FILES = 160;
const IMMUTABLE = /^\/(_next\/static|fonts|brand|icons)\//;

const keyOf = (url) => url.pathname + url.search;

async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('hc-') && n !== STATIC && n !== SAVED).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(navigate(event, req, url));
  } else if (IMMUTABLE.test(url.pathname)) {
    event.respondWith(cacheFirst(event, req));
  }
});

async function navigate(event, req, url) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const copy = res.clone();
      event.waitUntil(
        caches.open(SAVED).then(async (c) => {
          if (await c.match(keyOf(url))) await c.put(keyOf(url), copy);
        }),
      );
    }
    return res;
  } catch {
    const saved = await caches.open(SAVED).then((c) => c.match(keyOf(url)));
    if (saved) return saved;
    const offline = await caches.open(STATIC).then((c) => c.match(OFFLINE));
    return offline || new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(event, req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) {
    const copy = res.clone();
    event.waitUntil(cache.put(req, copy).then(() => trim(cache, MAX_STATIC_FILES)));
  }
  return res;
}

/* The page tells us which pages the reader saved or removed. */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (typeof data.url !== 'string') return;
  let url;
  try {
    url = new URL(data.url, self.location.origin);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (data.type === 'save') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(SAVED);
        const res = await fetch(keyOf(url), { credentials: 'same-origin' });
        const type = res.headers.get('content-type') || '';
        if (res.ok && type.includes('text/html')) {
          await cache.put(keyOf(url), res);
          await trim(cache, MAX_SAVED_PAGES);
        }
      })(),
    );
  } else if (data.type === 'unsave') {
    event.waitUntil(caches.open(SAVED).then((c) => c.delete(keyOf(url))));
  }
});
