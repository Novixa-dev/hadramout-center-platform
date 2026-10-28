import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV !== 'production';

// Public site CSP. Next.js needs inline scripts for hydration, so script-src keeps 'unsafe-inline'; everything else is locked down.
const CSP = [
  "default-src 'self'",
  // static.cloudflareinsights.com: Cloudflare Web Analytics beacon, injected by the CDN when enabled in the dashboard
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://files.hadramout.center https://i.ytimg.com",
  "font-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "connect-src 'self' https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Admin and REST API: Payload's admin needs inline/eval scripts, so it does not get the public CSP, but it must never be framed by
// another site (clickjacking a signed-in editor). 'self' keeps same-origin framing possible (e.g. a future live preview).
const ADMIN_CSP = "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
const NO_FOREIGN_FRAMES = [
  { key: 'Content-Security-Policy', value: ADMIN_CSP },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
];

const SECURITY = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/(.*)', headers: SECURITY },
      // brand/icon files are not content-hashed: a week of caching, revalidated afterwards
      // the service worker file must always be revalidated so a new version reaches visitors promptly
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/:dir(brand|icons|fonts)/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      // legacy-media sets its own sandboxing CSP in its route; a config header here would replace it (Next keeps the first value)
      { source: '/((?!admin|api|legacy-media).*)', headers: [{ key: 'Content-Security-Policy', value: CSP }] },
      { source: '/admin/:path*', headers: NO_FOREIGN_FRAMES },
      { source: '/api/:path((?!media/file/).*)', headers: NO_FOREIGN_FRAMES },
      // uploaded files: the config header replaces Payload's own file CSP, so it must carry its script ban as well
      { source: '/api/media/file/:path*', headers: [{ key: 'Content-Security-Policy', value: `script-src 'none'; frame-src 'none'; ${ADMIN_CSP}` }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
    ];
  },
  // Legacy item URLs (/articles/9597) are rewritten to the id-mapping handler here, not in proxy.ts: a rewrite returned by the proxy is
  // fetched over HTTP by the server itself and a reset connection ("Failed to proxy … ECONNRESET") answered 500 now and then.
  async rewrites() {
    return { beforeFiles: [{ source: '/:section(news|articles|books|magazines|events|forum|videos)/:id(\\d+)', destination: '/legacy/:section/:id' }], afterFiles: [], fallback: [] };
  },
  output: 'standalone',
  outputFileTracingExcludes: { '*': ['./docs/**', './tests/**', './data/**', './content/**', './deploy/**', './.git/**', './.next/cache/**'] },
  agentRules: false,
  poweredByHeader: false,
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/legacy-media/**' }],
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return webpackConfig;
  },
  turbopack: { root: path.resolve(dirname) },
};

const configured = withPayload(nextConfig, { devBundleServerPackages: false });

/**
 * withPayload adds `Accept-CH` / `Critical-CH: Sec-CH-Prefers-Color-Scheme` (+ a matching `Vary`) to EVERY path so the admin can
 * pick its theme on the first render. On the public site that header makes Chrome abort and repeat the first navigation
 * (an extra round trip, measured ≈ +1 TTFB), fragments any CDN cache by the hint, and breaks Lighthouse (NO_NAVSTART).
 * Keep the hint for /admin only.
 */
const CLIENT_HINT = /^(accept-ch|critical-ch)$/i;
const upstreamHeaders = configured.headers;
configured.headers = async () => {
  const rules = (await upstreamHeaders?.()) ?? [];
  const isHint = (h: { key: string; value: string }) => CLIENT_HINT.test(h.key) || (/^vary$/i.test(h.key) && /Sec-CH-Prefers-Color-Scheme/i.test(h.value));
  const adminHints = [
    { key: 'Accept-CH', value: 'Sec-CH-Prefers-Color-Scheme' },
    { key: 'Vary', value: 'Sec-CH-Prefers-Color-Scheme' },
    { key: 'Critical-CH', value: 'Sec-CH-Prefers-Color-Scheme' },
  ];
  return [...rules.map((r) => ({ ...r, headers: r.headers.filter((h) => !isHint(h)) })).filter((r) => r.headers.length > 0), { source: '/admin/:path*', headers: adminHints }];
};

export default configured;
