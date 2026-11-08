import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { LANGUAGES, POPULAR_CODES } from '../i18n/languages.ts';
import { clip } from '../lib/seo-text.ts';
import { Icon, SocialIcon, type SocialName } from './Icon.tsx';
import { LangPicker } from './client/LangPicker.tsx';
import { ThemeToggle } from './client/ThemeToggle.tsx';
import { MobileMenu } from './client/MobileMenu.tsx';
import { MainNav, type MenuEntry } from './client/MainNav.tsx';
import { NAV_TREE, UTILITY_LINKS, isGroup, type NavEntry } from '../lib/nav.ts';
import { SearchToggle } from './client/SearchToggle.tsx';
import { NewsletterForm } from './client/NewsletterForm.tsx';
import type { SearchLabels } from './client/SearchBox.tsx';
import type { getSite, NavPageDoc } from '../lib/data.ts';

type Site = Awaited<ReturnType<typeof getSite>>;

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

/** The menu tree in this language, plus pages an editor placed in the menu from the admin (top level or under About). */
function menuEntries(ctx: Ctx, navPages: NavPageDoc[]): MenuEntry[] {
  const { t, href } = ctx;
  const build = (e: NavEntry): MenuEntry => (isGroup(e) ? { label: t(e.key), items: e.items.map(build) } : { href: href(e.path), label: t(e.key) });
  const page = (p: NavPageDoc): MenuEntry => ({ href: href(`/${p.slug}`), label: p.navLabel || p.title });
  const entries = NAV_TREE.map(build);
  const about = entries[NAV_TREE.findIndex((e) => e.key === 'nav.g.about')];
  if (about && 'items' in about) about.items.push(...navPages.filter((p) => p.navPlacement === 'dropdown').map(page));
  const top = navPages.filter((p) => p.navPlacement === 'primary').map(page);
  // editor pages go before «اتصل بنا», which stays last as the Center asked
  return [...entries.slice(0, -1), ...top, ...entries.slice(-1)];
}

/** The slim bar above the header: store, members, research and magazine submissions, support, languages. */
export function UtilityBar({ ctx, langs }: { ctx: Ctx; langs: LangOption[] }) {
  const { t, href } = ctx;
  return (
    <div className="utilbar">
      <div className="container utilbar__row">
        <nav aria-label={t('util.label')}>
          <ul className="utilbar__list">
            {UTILITY_LINKS.map((u) => (
              <li key={u.key}>
                <Link prefetch={false} className="utilbar__link" href={href(u.path)}>
                  <Icon name={u.icon} />
                  <span className="utilbar__text">{t(u.key)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <LangPicker current={ctx.lang.code} currentNative={ctx.lang.native} options={langs} labels={{ pick: t('lang.pick'), title: t('lang.title'), search: t('lang.search'), popular: t('lang.popular'), all: t('lang.all'), note: t('lang.note'), close: t('nav.close'), none: t('lang.none'), machine: t('lang.machine') }} />
      </div>
    </div>
  );
}

export function Header({ ctx, site, navPages = [] }: { ctx: Ctx; site: Site; navPages?: NavPageDoc[] }) {
  const { t, href } = ctx;
  const entries = menuEntries(ctx, navPages);
  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link prefetch={false} className="brand" href={href('/')}>
          <img className="brand__mark" src="/brand/logo-icon.svg" alt="" width={28} height={58} />
          <span className="brand__text">
            <span className="brand__name">{site.shortName || site.name}</span>
            <span className="brand__sub">{t('header.sub')}</span>
          </span>
        </Link>
        <div className="header-tools">
          <SearchToggle action={href('/search')} lang={ctx.lang.code} labels={searchLabels(ctx)} hint={t('search.panel.hint')} />
          <span className="theme-desktop"><ThemeToggle label={t('theme.toggle')} /></span>
          <MobileMenu label={t('nav.menu')} closeLabel={t('nav.close')} entries={[...entries, { href: href('/saved'), label: t('saved.title') }]} footer={<ThemeToggle label={t('theme.toggle')} />} />
        </div>
      </div>
      <nav className="nav" aria-label={t('nav.main')}>
        <div className="container">
          <MainNav entries={entries} />
        </div>
      </nav>
    </header>
  );
}

/** Footer «استكشف» column: the archive sections and media libraries. */
const FOOTER_EXPLORE = [
  { key: 'nav.news', path: '/news' },
  { key: 'nav.articles', path: '/articles' },
  { key: 'nav.books', path: '/books' },
  { key: 'nav.magazines', path: '/magazines' },
  { key: 'nav.events', path: '/events' },
  { key: 'nav.forum', path: '/forum' },
  { key: 'nav.videos', path: '/videos' },
  { key: 'nav.audio', path: '/audio' },
  { key: 'nav.podcast', path: '/podcast' },
  { key: 'nav.announcements', path: '/announcements' },
  { key: 'nav.topics', path: '/topics' },
] as const;

export function Footer({ ctx, site, navPages = [] }: { ctx: Ctx; site: Site; navPages?: NavPageDoc[] }) {
  const { t, href } = ctx;
  const footerAboutDynamic = navPages.filter((p) => p.navPlacement === 'footer_about');
  const footerExploreDynamic = navPages.filter((p) => p.navPlacement === 'footer_explore');
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
              {FOOTER_EXPLORE.map((n) => (
                <li key={n.path}><Link prefetch={false} href={href(n.path)}>{t(n.key)}</Link></li>
              ))}
              {footerExploreDynamic.map((p) => (
                <li key={p.slug}><Link prefetch={false} href={href(`/${p.slug}`)}>{p.navLabel || p.title}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t('footer.research')}>
            <h3>{t('footer.research')}</h3>
            <ul>
              <li><Link prefetch={false} href={href('/search')}>{t('nav.search')}</Link></li>
              <li><Link prefetch={false} href={href('/authors')}>{t('nav.authors')}</Link></li>
              <li><Link prefetch={false} href={href('/timeline')}>{t('nav.timeline')}</Link></li>
              <li><Link prefetch={false} href={href('/submit')}>{t('nav.submit')}</Link></li>
              <li><Link prefetch={false} href={href('/saved')}>{t('saved.title')}</Link></li>
              <li><a href={`/feeds/${ctx.lang.code}/all.xml`}>{t('footer.rss')}</a></li>
            </ul>
          </nav>
          <nav aria-label={t('footer.about')}>
            <h3>{t('footer.about')}</h3>
            <ul>
              <li><Link prefetch={false} href={href('/about')}>{t('nav.about')}</Link></li>
              <li><Link prefetch={false} href={href('/governance/regulations')}>{t('nav.g.governance')}</Link></li>
              <li><Link prefetch={false} href={href('/partners')}>{t('nav.partners')}</Link></li>
              <li><Link prefetch={false} href={href('/support')}>{t('util.support')}</Link></li>
              <li><Link prefetch={false} href={href('/contact')}>{t('nav.contact')}</Link></li>
              <li><Link prefetch={false} href={href('/privacy')}>{t('footer.privacy')}</Link></li>
              <li><Link prefetch={false} href={href('/terms')}>{t('footer.terms')}</Link></li>
              <li><Link prefetch={false} href={href('/accessibility')}>{t('footer.accessibility')}</Link></li>
              <li><Link prefetch={false} href={href('/novixa')}>{t('footer.novixa')}</Link></li>
              {footerAboutDynamic.map((p) => (
                <li key={p.slug}><Link prefetch={false} href={href(`/${p.slug}`)}>{p.navLabel || p.title}</Link></li>
              ))}
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
          <span>{t('footer.built')} <Link prefetch={false} href={href('/novixa')}>Novixa</Link></span>
        </div>
      </div>
    </footer>
  );
}
