import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { LANGUAGES, POPULAR_CODES } from '../i18n/languages.ts';
import { clip } from '../lib/seo-text.ts';
import { Icon, SocialIcon, type SocialName } from './Icon.tsx';
import { LangPicker } from './client/LangPicker.tsx';
import { ThemeToggle } from './client/ThemeToggle.tsx';
import { MobileMenu } from './client/MobileMenu.tsx';
import { PriorityNav } from './client/PriorityNav.tsx';
import { SearchToggle } from './client/SearchToggle.tsx';
import { NewsletterForm } from './client/NewsletterForm.tsx';
import type { SearchLabels } from './client/SearchBox.tsx';
import type { getSite } from '../lib/data.ts';

type Site = Awaited<ReturnType<typeof getSite>>;

/** Sections that stay visible in the header; everything else lives under "More" so nothing is crowded. */
const PRIMARY = [
  { key: 'nav.news', path: '/news' },
  { key: 'nav.articles', path: '/articles' },
  { key: 'nav.books', path: '/books' },
  { key: 'nav.magazines', path: '/magazines' },
  { key: 'nav.events', path: '/events' },
  { key: 'nav.videos', path: '/videos' },
] as const;

const SECONDARY = [
  { key: 'nav.topics', path: '/topics' },
  { key: 'nav.forum', path: '/forum' },
  { key: 'nav.authors', path: '/authors' },
  { key: 'nav.timeline', path: '/timeline' },
  { key: 'nav.about', path: '/about' },
  { key: 'nav.contact', path: '/contact' },
] as const;

export const NAV = [...PRIMARY, ...SECONDARY] as const;

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

const KINDS = ['news', 'articles', 'books', 'magazines', 'events', 'forum-events', 'videos'] as const;

export function searchLabels(ctx: Ctx): SearchLabels {
  const { t } = ctx;
  return {
    label: t('nav.search'),
    placeholder: t('search.placeholder'),
    submit: t('home.search.submit'),
    loading: t('search.suggest.loading'),
    none: t('search.suggest.none'),
    viewAll: t('search.suggest.viewAll', { q: '{q}' }),
    recent: t('search.recent'),
    clearRecent: t('search.recent.clear'),
    count: t('search.suggest.count', { count: '{count}' }),
    kinds: Object.fromEntries(KINDS.map((k) => [k, t(`type.${k}`)])),
  };
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
          <PriorityNav items={PRIMARY.map((n) => ({ href: href(n.path), label: t(n.key) }))} more={SECONDARY.map((n) => ({ href: href(n.path), label: t(n.key) }))} moreLabel={t('nav.more')} />
        </nav>
        <div className="header-tools">
          <SearchToggle action={href('/search')} lang={ctx.lang.code} labels={searchLabels(ctx)} hint={t('search.panel.hint')} />
          <LangPicker current={ctx.lang.code} currentNative={ctx.lang.native} options={langs} labels={{ pick: t('lang.pick'), title: t('lang.title'), search: t('lang.search'), popular: t('lang.popular'), all: t('lang.all'), note: t('lang.note'), close: t('nav.close'), none: t('lang.none'), machine: t('lang.machine') }} />
          <span className="theme-desktop"><ThemeToggle label={t('theme.toggle')} /></span>
          <MobileMenu
            label={t('nav.menu')}
            closeLabel={t('nav.close')}
            items={[{ href: href('/'), label: t('nav.home') }, ...NAV.map((n) => ({ href: href(n.path), label: t(n.key) })), { href: href('/saved'), label: t('saved.title') }]}
            footer={<ThemeToggle label={t('theme.toggle')} />}
          />
        </div>
      </div>
    </header>
  );
}

export function Footer({ ctx, site }: { ctx: Ctx; site: Site }) {
  const { t, href } = ctx;
  const social = site.social ?? {};
  const links: { name: SocialName; label: string; url?: string }[] = [
    { name: 'x', label: 'X', url: social.x },
    { name: 'facebook', label: 'Facebook', url: social.facebook },
    { name: 'instagram', label: 'Instagram', url: social.instagram },
    { name: 'telegram', label: 'Telegram', url: social.telegram },
    { name: 'youtube', label: 'YouTube', url: social.youtube },
  ];
  const whatsapp = (site.whatsapp ?? []).filter((w) => w.number);
  return (
    <footer className="site-footer pattern">
      <div className="container">
        <div className="footer-news">
          <div>
            <h2>{t('newsletter.title')}</h2>
            <p>{t('newsletter.text')}</p>
          </div>
          <NewsletterForm lang={ctx.lang.code} variant="inline" labels={{ email: t('newsletter.email'), submit: t('newsletter.submit'), ok: t('newsletter.ok'), error: t('newsletter.error') }} />
        </div>
        <div className="site-footer__grid">
          <div>
            <h2>{site.name}</h2>
            {site.description ? <p className="site-footer__about">{clip(site.description, 230)}</p> : null}
            <div className="social" style={{ marginBlockStart: '1rem' }}>
              {links.filter((l) => l.url).map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`${l.label} (${t('a11y.newWindow')})`} title={l.label}>
                  <SocialIcon name={l.name} />
                </a>
              ))}
              {whatsapp.map((w) => (
                <a key={w.number} className="social__wa" href={`https://wa.me/${w.number.replace(/[^0-9]/g, '').replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${w.label ?? ''} ${w.number} (${t('a11y.newWindow')})`} title={`WhatsApp ${w.label ?? ''} ${w.number}`}>
                  <SocialIcon name="whatsapp" />
                  {w.label ? <span aria-hidden="true">{w.label}</span> : null}
                </a>
              ))}
            </div>
          </div>
          <nav aria-label={t('footer.explore')}>
            <h3>{t('footer.explore')}</h3>
            <ul>
              {[...PRIMARY, SECONDARY[0], SECONDARY[1]].map((n) => (
                <li key={n.path}><Link href={href(n.path)}>{t(n.key)}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t('footer.research')}>
            <h3>{t('footer.research')}</h3>
            <ul>
              <li><Link href={href('/search')}>{t('nav.search')}</Link></li>
              <li><Link href={href('/authors')}>{t('nav.authors')}</Link></li>
              <li><Link href={href('/timeline')}>{t('nav.timeline')}</Link></li>
              <li><Link href={href('/saved')}>{t('saved.title')}</Link></li>
              <li><a href={`/feeds/${ctx.lang.code}/all.xml`}>{t('footer.rss')}</a></li>
            </ul>
          </nav>
          <nav aria-label={t('footer.about')}>
            <h3>{t('footer.about')}</h3>
            <ul>
              <li><Link href={href('/about')}>{t('nav.about')}</Link></li>
              <li><Link href={href('/contact')}>{t('nav.contact')}</Link></li>
              <li><Link href={href('/privacy')}>{t('footer.privacy')}</Link></li>
              <li><Link href={href('/terms')}>{t('footer.terms')}</Link></li>
              <li><Link href={href('/accessibility')}>{t('footer.accessibility')}</Link></li>
              <li><Link href={href('/novixa')}>{t('footer.novixa')}</Link></li>
            </ul>
          </nav>
          <div>
            <h3>{t('contact.title')}</h3>
            <ul>
              {site.address ? <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}><Icon name="pin" /><span>{site.address}</span></li> : null}
              {site.email ? <li><a href={`mailto:${site.email}`} style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}><Icon name="mail" />&nbsp;{site.email}</a></li> : null}
            </ul>
          </div>
        </div>
        <div className="site-footer__legal">
          <span>© {new Date().getFullYear()} {site.name} — {t('footer.rights')}</span>
          <span>{t('footer.built')} <Link href={href('/novixa')}>Novixa</Link></span>
        </div>
      </div>
    </footer>
  );
}
