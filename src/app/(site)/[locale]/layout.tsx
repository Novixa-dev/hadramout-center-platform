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

export const dynamicParams = true;
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffbf5' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1815' },
  ],
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

const THEME_INIT = `(function(){try{var d=document.documentElement,t=localStorage.getItem('hc-theme'),f=localStorage.getItem('hc-fs');if(t)d.setAttribute('data-theme',t);if(f)d.setAttribute('data-fs',f)}catch(e){}})()`;

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || !enabledOrAll().has(locale)) notFound();
  const ctx = makeCtx(locale);
  const site = await getSite(locale);
  const ready = new Set(['ar', 'en', ...[...enabledOrAll()].filter((c) => uiCoverage(c) >= 0.95)]);
  return (
    <html lang={ctx.lang.tag} dir={ctx.lang.dir} suppressHydrationWarning>
      <head>
        {locale === 'ar' ? (
          <>
            <link rel="preload" href="/fonts/plex-ar-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/plex-ar-600.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          </>
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">{ctx.t('site.skip')}</a>
        <Header ctx={ctx} site={site} langs={langOptions(ready)} />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer ctx={ctx} site={site} />
        <BackToTop label={ctx.t('tools.backToTop')} />
      </body>
    </html>
  );
}
