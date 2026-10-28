import { NextResponse, type NextRequest } from 'next/server';
import { enabledOrAll, negotiate } from './lib/negotiate.ts';
import { clampRestQuery } from './lib/rest-limits.ts';
import { MAINTENANCE_HTML, RETRY_AFTER_SECONDS, isMaintenanceExempt } from './lib/maintenance.ts';
import { STAGING_ROBOTS_HEADER, isProductionSite } from './lib/site-env.ts';

/**
 * Edge of the site:
 *  - "/" and any path without a language prefix → redirect to the visitor's language
 *  - legacy URLs (/articles/9597 …) → internal redirect handler that maps old ids
 * Admin, API, assets and SEO files are left alone.
 */
const SKIP = /^\/(admin|api|_next|brand|icons|fonts|og|feeds|sitemap|robots|manifest|sw\.js|healthz|legacy|favicon|media)/;
const ADMIN_LANG_COOKIE = 'payload-lng';
const LEGACY = /^\/(news|articles|books|magazines|events|forum|videos)\/(\d+)\/?$/;
const LEGACY_LIST = /^\/(news|articles|books|magazines|events|forum|videos|about)\/?$/;

function route(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;

  // Maintenance mode (MAINTENANCE_MODE=1 in the server .env, then restart the app): public pages answer 503 + Retry-After.
  if (process.env.MAINTENANCE_MODE === '1' && !isMaintenanceExempt(pathname)) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': String(RETRY_AFTER_SECONDS), 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
    });
  }

  // Reads of the REST API get a hard ceiling on page size and relationship depth. There is deliberately no staff exemption:
  // a cookie cannot be validated here, so an exemption would be bypassable with any fake value (the admin UI stays well under the ceiling).
  if (req.method === 'GET' && pathname.startsWith('/api/') && !pathname.startsWith('/api/hc/')) {
    const clamped = clampRestQuery(search);
    if (clamped !== null) {
      // A rewrite would not change the query string the REST handler reads, so clients are redirected to the clamped URL.
      // The target is built on the request's own URL: Next.js then sends a *relative* Location (same host → relativized), which
      // the browser resolves against the address it actually used. Building it on SITE_URL sent the admin's own requests (its
      // table cells ask for limit=250) to another origin whenever the admin was opened on any other host (a new domain during
      // the move, localhost), where CORS blocked them and author names stayed "Loading…".
      const target = req.nextUrl.clone();
      target.search = clamped;
      return NextResponse.redirect(target, 307);
    }
  }
  // No email adapter is configured (payload.config.ts), so a password-reset request can never reach anyone: Payload would only
  // write the reset link and its token to the server log (SEC-012). Refused until a mail provider exists (set MAIL_PROVIDER then,
  // and remove the custom "forgot" view). An administrator resets a password from the user's page instead.
  if (pathname === '/api/users/forgot-password' && !process.env.MAIL_PROVIDER) {
    return NextResponse.json({ errors: [{ message: 'Password reset by email is not available. Ask an administrator to set a temporary password.' }] }, { status: 403 });
  }
  // The admin is Arabic-first like the site. Until a staff member picks a language (Payload's `payload-lng` cookie, set by the
  // switch in the header and on the sign-in screen) Payload would follow the browser's Accept-Language, so an English browser
  // got an English sign-in page and English API error messages. Content locales are not affected (they use ?locale=).
  if ((pathname.startsWith('/admin') || pathname.startsWith('/api/users')) && !req.cookies.has(ADMIN_LANG_COOKIE)) {
    const headers = new Headers(req.headers);
    headers.set('accept-language', 'ar');
    return NextResponse.next({ request: { headers } });
  }
  if (SKIP.test(pathname) || /\.[a-z0-9]{2,5}$/i.test(pathname)) return NextResponse.next();

  const first = pathname.split('/')[1] ?? '';
  if (enabledOrAll().has(first)) {
    const headers = new Headers(req.headers);
    headers.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers } });
  }

  // legacy item URLs: rewritten to the id-mapping handler by next.config.ts (rewrites), so the proxy only lets them through
  if (LEGACY.test(pathname)) return NextResponse.next();
  // the legacy sitemap listed the singular "/magazine"
  if (/^\/magazine\/?$/.test(pathname)) {
    const lang = negotiate(req.cookies.get('hc_lang')?.value, req.headers.get('accept-language'));
    return NextResponse.redirect(new URL(`/${lang}/magazines${search}`, req.url), 308);
  }
  if (LEGACY_LIST.test(pathname)) {
    const lang = negotiate(req.cookies.get('hc_lang')?.value, req.headers.get('accept-language'));
    return NextResponse.redirect(new URL(`/${lang}${pathname.replace(/\/$/, '')}${search}`, req.url), 308);
  }

  const lang = negotiate(req.cookies.get('hc_lang')?.value, req.headers.get('accept-language'));
  return NextResponse.redirect(new URL(`/${lang}${pathname === '/' ? '' : pathname}${search}`, req.url), 307);
}

export function proxy(req: NextRequest) {
  const res = route(req);
  // A staging deployment is never indexable: the header also covers feeds, JSON, images and PDFs, which cannot carry a meta tag.
  if (!isProductionSite()) res.headers.set('x-robots-tag', STAGING_ROBOTS_HEADER);
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
