import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import '../../../styles/index.css';
import { isLocale, makeCtx } from '../../../lib/ctx.ts';
import { enabledOrAll } from '../../../lib/negotiate.ts';
import { getSite } from '../../../lib/data.ts';
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/brand/logo-icon.svg', type: 'image/svg+xml' }], apple: '/icons/icon-192.png' },
  formatDetection: { telephone: false },
};

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
