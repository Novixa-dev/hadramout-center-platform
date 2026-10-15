import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { LANGUAGES, POPULAR_CODES } from '../i18n/languages.ts';
import { Icon } from './Icon.tsx';
import { LangPicker } from './client/LangPicker.tsx';
import { ThemeToggle } from './client/ThemeToggle.tsx';
import { MobileMenu } from './client/MobileMenu.tsx';
import { NavLinks } from './client/NavLinks.tsx';
import { NavMore } from './client/NavMore.tsx';
import type { getSite } from '../lib/data.ts';

type Site = Awaited<ReturnType<typeof getSite>>;

export const NAV = [
  { key: 'nav.news', path: '/news' },
  { key: 'nav.articles', path: '/articles' },
  { key: 'nav.books', path: '/books' },
  { key: 'nav.magazines', path: '/magazines' },
  { key: 'nav.events', path: '/events' },
  { key: 'nav.forum', path: '/forum' },
  { key: 'nav.videos', path: '/videos' },
  { key: 'nav.about', path: '/about' },
  { key: 'nav.contact', path: '/contact' },
] as const;

/** Primary sections stay visible in the header; the rest live under "More" so nothing is crowded. */
const PRIMARY = NAV.slice(0, 5);
const SECONDARY = [
  { key: 'nav.forum', path: '/forum' },
  { key: 'nav.about', path: '/about' },
  { key: 'nav.timeline', path: '/timeline' },
  { key: 'nav.authors', path: '/authors' },
  { key: 'nav.contact', path: '/contact' },
] as const;

export interface LangOption {
  code: string;
  native: string;
  english: string;
  dir: string;
  popular: boolean;
  ready: boolean;
}

export function langOptions(readyCodes: Set<string>): LangOption[] {
  return LANGUAGES.map((l) => ({ code: l.code, native: l.native, english: l.english, dir: l.dir, popular: (POPULAR_CODES as readonly string[]).includes(l.code), ready: readyCodes.has(l.code) }));
}

export function Header({ ctx, site, langs }: { ctx: Ctx; site: Site; langs: LangOption[] }) {
  const { t, href } = ctx;
  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link className="brand" href={href('/')}>
          <img className="brand__mark" src="/brand/logo-icon.svg" alt="" width={32} height={57} />
          <span className="brand__text">
            <span className="brand__name">{site.shortName || site.name}</span>
            <span className="brand__sub">{t('header.sub')}</span>
          </span>
        </Link>
        <nav className="nav" aria-label={t('nav.main')}>
          <NavLinks items={[...PRIMARY, { key: 'nav.videos', path: '/videos' }].map((n) => ({ href: href(n.path), label: t(n.key) }))}>
            <NavMore label={t('nav.more')} items={SECONDARY.map((n) => ({ href: href(n.path), label: t(n.key) }))} />
          </NavLinks>
        </nav>
        <div className="header-tools">
          <Link className="icon-btn" href={href('/search')} aria-label={t('nav.search')}>
            <Icon name="search" />
          </Link>
          <LangPicker current={ctx.lang.code} currentNative={ctx.lang.native} options={langs} labels={{ pick: t('lang.pick'), title: t('lang.title'), search: t('lang.search'), popular: t('lang.popular'), all: t('lang.all'), note: t('lang.note'), close: t('nav.close'), none: t('lang.none'), machine: t('lang.machine') }} />
          <ThemeToggle label={t('theme.toggle')} />
          <MobileMenu label={t('nav.menu')} closeLabel={t('nav.close')} items={[...NAV.map((n) => ({ href: href(n.path), label: t(n.key) })), { href: href('/authors'), label: t('nav.authors') }, { href: href('/timeline'), label: t('nav.timeline') }]} />
        </div>
      </div>
    </header>
  );
}

export function Footer({ ctx, site }: { ctx: Ctx; site: Site }) {
  const { t, href } = ctx;
  const social = site.social ?? {};
  const links: { label: string; url?: string }[] = [
    { label: 'X', url: social.x },
    { label: 'Facebook', url: social.facebook },
    { label: 'Instagram', url: social.instagram },
    { label: 'Telegram', url: social.telegram },
    { label: 'YouTube', url: social.youtube },
  ];
  return (
    <footer className="site-footer pattern">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <h2>{site.name}</h2>
            <p style={{ color: '#cfe0d9', fontSize: 'var(--step--1)' }}>{site.tagline}</p>
          </div>
          <div>
            <h2>{t('footer.explore')}</h2>
            <ul>
              {NAV.slice(0, 7).map((n) => (
                <li key={n.path}>
                  <Link href={href(n.path)}>{t(n.key)}</Link>
                </li>
              ))}
              <li><Link href={href('/authors')}>{t('nav.authors')}</Link></li>
              <li><Link href={href('/timeline')}>{t('nav.timeline')}</Link></li>
            </ul>
          </div>
          <div>
            <h2>{t('footer.about')}</h2>
            <ul>
              <li><Link href={href('/about')}>{t('nav.about')}</Link></li>
              <li><Link href={href('/contact')}>{t('nav.contact')}</Link></li>
              <li><Link href={href('/search')}>{t('nav.search')}</Link></li>
              <li><Link href={href('/saved')}>{t('saved.title')}</Link></li>
            </ul>
            <h2 style={{ marginBlockStart: '1.25rem' }}>{t('footer.legal')}</h2>
            <ul>
              <li><Link href={href('/privacy')}>{t('footer.privacy')}</Link></li>
              <li><Link href={href('/terms')}>{t('footer.terms')}</Link></li>
              <li><Link href={href('/accessibility')}>{t('footer.accessibility')}</Link></li>
              <li><a href={`/feeds/${ctx.lang.code}/all.xml`}>{t('footer.rss')}</a></li>
            </ul>
          </div>
          <div>
            <h2>{t('contact.title')}</h2>
            <ul>
              {site.address ? <li>{site.address}</li> : null}
              {site.email ? <li><a href={`mailto:${site.email}`}>{site.email}</a></li> : null}
            </ul>
            <div className="social" style={{ marginBlockStart: '0.9rem' }}>
              {links.filter((l) => l.url).map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`${l.label} (${t('a11y.newWindow')})`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  {l.label.slice(0, 2)}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="site-footer__legal">
          <span>© {new Date().getFullYear()} {site.name} — {t('footer.rights')}</span>
          <span>{t('footer.built')} <a href="https://novixa.dev" target="_blank" rel="noopener noreferrer">Novixa</a></span>
        </div>
      </div>
    </footer>
  );
}
