import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import '../../../styles/index.css';
import { isLocale, makeCtx } from '../../../lib/ctx.ts';
import { enabledOrAll } from '../../../lib/negotiate.ts';
import { getSite } from '../../../lib/data.ts';
import { loadConfig } from '../../../config.ts';
import { uiCoverage } from '../../../i18n/ui-store.ts';
import { Footer, Header, langOptions } from '../../../components/Shell.tsx';
import { BackToTop } from '../../../components/client/BackToTop.tsx';
import { PwaRegister } from '../../../components/client/PwaRegister.tsx';
import { StagingBar } from '../../../components/StagingBar.tsx';
import { isProductionSite } from '../../../lib/site-env.ts';

export const dynamicParams = true;
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

// NB: no `themeColor` here. Next.js turns a light/dark themeColor array into `Accept-CH` + `Critical-CH: Sec-CH-Prefers-Color-Scheme`,
// which makes Chrome abort and repeat the very first navigation (an extra round trip, fragmented CDN cache, Lighthouse NO_NAVSTART).
// The two theme-color <meta> tags are rendered by hand in <head> instead.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const site = await getSite(isLocale(locale) ? locale : 'ar');
  const base = loadConfig().siteUrl;
  return {
    metadataBase: new URL(base),
    applicationName: site.name,
    title: { default: site.name, template: `%s | ${site.shortName || site.name}` },
    publisher: site.name,
    creator: 'Novixa',
    manifest: '/manifest.webmanifest',
    icons: { icon: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/brand/logo-icon.svg', type: 'image/svg+xml' }], apple: '/icons/icon-192.png' },
    formatDetection: { telephone: false, email: false, address: false },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined, other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined },
  };
}

// Dark is the site's default theme (server-rendered as data-theme="dark", so there is no flash and it works without JavaScript).
// A visitor's explicit choice, stored by the toggle, overrides it before first paint; the browser's own colour-scheme setting is not consulted.
const THEME_INIT = `(function(){try{var d=document.documentElement,t=localStorage.getItem('hc-theme'),f=localStorage.getItem('hc-fs');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t);var m=document.getElementById('hc-theme-color');if(m)m.setAttribute('content',t==='light'?'#fffbf5':'#0e1815')}if(f)d.setAttribute('data-fs',f)}catch(e){}})()`;

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || !enabledOrAll().has(locale)) notFound();
  const ctx = makeCtx(locale);
  const site = await getSite(locale);
  const ready = new Set(['ar', 'en', ...[...enabledOrAll()].filter((c) => uiCoverage(c) >= 0.95)]);
  return (
    <html lang={ctx.lang.tag} dir={ctx.lang.dir} data-theme="dark" suppressHydrationWarning>
      <head>
        <meta id="hc-theme-color" name="theme-color" content="#0e1815" />
        {locale === 'ar' ? (
          <>
            <link rel="preload" href="/fonts/plexui-ar-400-v2.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/plexui-ar-600-v2.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/naskh-ar-700-v2.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          </>
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">{ctx.t('site.skip')}</a>
        {isProductionSite() ? null : <StagingBar text={ctx.t('staging.banner')} />}
        <Header ctx={ctx} site={site} langs={langOptions(ready)} />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer ctx={ctx} site={site} />
        <BackToTop label={ctx.t('tools.backToTop')} />
        <PwaRegister />
      </body>
    </html>
  );
}
