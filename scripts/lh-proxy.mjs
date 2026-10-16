#!/usr/bin/env node
/**
 * Tiny pass-through proxy for lab measurements: removes `Cross-Origin-Opener-Policy` from responses.
 *
 * Lighthouse (CLI) cannot trace a page that sends `COOP: same-origin` — it fails with NO_NAVSTART because the navigation
 * from about:blank swaps browsing context groups. The header is a deliberate security setting of the site and stays; this
 * proxy only exists so a performance trace can be recorded:
 *
 *   node scripts/lh-proxy.mjs http://localhost:3100 3200 &
 *   node scripts/lighthouse.mjs http://localhost:3200
 *
 * Works for http and https targets. Not for production use.
 */
import http from 'node:http';
import https from 'node:https';

const target = new URL(process.argv[2] ?? 'http://localhost:3100');
const port = Number(process.argv[3] ?? 3200);
const client = target.protocol === 'https:' ? https : http;

http
  .createServer((req, res) => {
    const headers = { ...req.headers, host: target.host };
    // accept-encoding is forwarded untouched: the compressed body and its content-encoding header pass through as-is,
    // so transfer sizes in the trace are the real (compressed) ones
    const up = client.request({ hostname: target.hostname, port: target.port || undefined, path: req.url, method: req.method, headers }, (r) => {
      const out = { ...r.headers };
      delete out['cross-origin-opener-policy'];
      res.writeHead(r.statusCode ?? 502, out);
      r.pipe(res);
    });
    up.on('error', () => {
      res.writeHead(502);
      res.end('upstream error');
    });
    req.pipe(up);
  })
  .listen(port, () => console.log(`proxy http://localhost:${port} → ${target.origin} (COOP stripped)`));
