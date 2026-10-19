import { NextResponse, type NextRequest } from 'next/server';
import { enabledOrAll, negotiate } from './lib/negotiate.ts';

/**
 * Edge of the site:
 *  - "/" and any path without a language prefix → redirect to the visitor's language
 *  - legacy URLs (/articles/9597 …) → internal redirect handler that maps old ids
 * Admin, API, assets and SEO files are left alone.
 */
const SKIP = /^\/(admin|api|_next|brand|icons|fonts|og|feeds|sitemap|robots|manifest|sw\.js|healthz|legacy|favicon|media)/;
const LEGACY = /^\/(news|articles|books|magazines|events|forum|videos)\/(\d+)\/?$/;
const LEGACY_LIST = /^\/(news|articles|books|magazines|events|forum|videos|about)\/?$/;

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (SKIP.test(pathname) || /\.[a-z0-9]{2,5}$/i.test(pathname)) return NextResponse.next();

  const first = pathname.split('/')[1] ?? '';
  if (enabledOrAll().has(first)) {
    const headers = new Headers(req.headers);
    headers.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers } });
  }

  const legacy = pathname.match(LEGACY);
  if (legacy) return NextResponse.rewrite(new URL(`/legacy/${legacy[1]}/${legacy[2]}`, req.url));
  if (LEGACY_LIST.test(pathname)) {
    const lang = negotiate(req.cookies.get('hc_lang')?.value, req.headers.get('accept-language'));
    return NextResponse.redirect(new URL(`/${lang}${pathname.replace(/\/$/, '')}${search}`, req.url), 308);
  }

  const lang = negotiate(req.cookies.get('hc_lang')?.value, req.headers.get('accept-language'));
  return NextResponse.redirect(new URL(`/${lang}${pathname === '/' ? '' : pathname}${search}`, req.url), 307);
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
