import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { LANGUAGES, POPULAR_CODES } from '../i18n/languages.ts';
import { Icon, SocialIcon, type SocialName } from './Icon.tsx';
import { Skyline } from './Skyline.tsx';
import { HeaderScroll } from './client/HeaderScroll.tsx';
import { LangPicker } from './client/LangPicker.tsx';
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

export const HEADER_NAV = [
  { key: 'nav.home', path: '/' },
  { key: 'nav.archive', path: '/search' },
  { key: 'nav.magazinesScientific', path: '/magazines' },
  { key: 'nav.studiesAndBooks', path: '/books' },
  { key: 'nav.aboutProject', path: '/about' },
  { key: 'nav.contactUs', path: '/contact' },
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
    <header className="site-header main-header">
      <HeaderScroll />
      <div className="container site-header__bar">
        <Link className="brand" href={href('/')} aria-label={site.name}>
          <img className="brand__logo-img" src="/brand/logo.svg" alt={site.name} width={160} height={37} />
        </Link>
        <nav className="nav header-nav" aria-label={t('nav.main')}>
          <PriorityNav
            items={HEADER_NAV.map((n) => ({ href: href(n.path), label: t(n.key) }))}
            more={[]}
            moreLabel={t('nav.more')}
          />
        </nav>
        <div className="header-tools">
          <SearchToggle action={href('/search')} lang={ctx.lang.code} labels={searchLabels(ctx)} hint={t('search.panel.hint')} />
          <span className="header-tools__sep" aria-hidden="true" />
          <LangPicker badge current={ctx.lang.code} currentNative={ctx.lang.native} options={langs} labels={{ pick: t('lang.pick'), title: t('lang.title'), search: t('lang.search'), popular: t('lang.popular'), all: t('lang.all'), note: t('lang.note'), close: t('nav.close'), none: t('lang.none'), machine: t('lang.machine') }} />
          <Link href={href('/admin')} className="header-btn header-btn--solid">
            <Icon name="user" className="header-btn__icon" />
            <span>{t('header.login')}</span>
          </Link>
          <Link href={href('/admin')} className="header-icon-btn" aria-label={t('header.login')} title={t('header.login')}>
            <Icon name="user" />
          </Link>
          <MobileMenu
            label={t('nav.menu')}
            closeLabel={t('nav.close')}
            items={[{ href: href('/'), label: t('nav.home') }, ...NAV.map((n) => ({ href: href(n.path), label: t(n.key) })), { href: href('/admin'), label: t('header.login') }, { href: href('/saved'), label: t('saved.title') }]}
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

  // Exact 8 links for Column 2: Browse
  const browseLinks = [
    { label: t('nav.news'), path: '/news' },
    { label: t('nav.articles'), path: '/articles' },
    { label: t('nav.books'), path: '/books' },
    { label: t('nav.magazines'), path: '/magazines' },
    { label: t('nav.events'), path: '/events' },
    { label: t('nav.videos'), path: '/videos' },
    { label: t('nav.topics'), path: '/topics' },
    { label: t('nav.forum'), path: '/forum' },
  ];

  // Exact 5 links for Column 3: Research Tools
  const researchLinks = [
    { label: t('nav.search'), path: '/search', isRss: false },
    { label: t('nav.authors'), path: '/authors', isRss: false },
    { label: t('nav.timeline'), path: '/timeline', isRss: false },
    { label: t('saved.title'), path: '/saved', isRss: false },
    { label: t('footer.rss'), path: `/feeds/${ctx.lang.code}/all.xml`, isRss: true },
  ];

  // Exact 5 links for Column 4: Center Information
  const centerLinks = [
    { label: t('nav.about'), path: '/about' },
    { label: t('nav.contact'), path: '/contact' },
    { label: t('footer.privacy'), path: '/privacy' },
    { label: t('footer.terms'), path: '/terms' },
    { label: t('footer.accessibility'), path: '/accessibility' },
  ];

  const fullDescription = ctx.lang.code === 'ar'
    ? (site.description || 'يعد مركز حضرموت للدراسات التاريخية والتوثيق والنشر من المراكز العلمية المستقلة، يمارس نشاطه في مجالات الدراسات والبحوث التاريخية والترجمة والتوثيق والنشر، ويخصص حيزاً كبيراً من نشاطه العلمي لدراسة تاريخ حضرموت وحضارتها وأعلامها.')
    : (site.tagline && !/[\u0600-\u06FF]/.test(site.tagline)
      ? site.tagline
      : 'The Hadramout Center for Historical Studies, Documentation and Publishing is an independent scientific research institution dedicated to historical studies, documentation, translation, and preserving Hadramout heritage.');

  return (
    <footer className="hc-footer" role="contentinfo">
      {/* ── 1. Newsletter Subscription Section ────────────────────────────── */}
      <section className="hc-footer__newsletter-section" aria-labelledby="hc-nl-title">
        <div className="container">
          <div className="hc-nl-card">
            <div className="hc-nl-card__bg-pattern" aria-hidden="true">
              <Icon name="rosette" className="hc-nl-card__rosette" />
            </div>

            <div className="hc-nl-card__header">
              <div className="hc-nl-card__badge">
                <Icon name="mail" className="hc-nl-card__badge-icon" />
                <span>{ctx.lang.code === 'ar' ? 'التحديثات والمستجدات' : 'Stay Updated'}</span>
              </div>
              <h2 id="hc-nl-title" className="hc-nl-card__title">
                {t('newsletter.title')}
              </h2>
              <p className="hc-nl-card__text">
                {t('newsletter.text')}
              </p>
            </div>

            <div className="hc-nl-card__form-area">
              <NewsletterForm
                lang={ctx.lang.code}
                variant="premium"
                labels={{
                  email: t('newsletter.email'),
                  submit: t('newsletter.submit'),
                  ok: t('newsletter.ok'),
                  error: t('newsletter.error'),
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Skyline of Shibam Towers */}
      <div className="hc-footer__skyline-wrapper" aria-hidden="true">
        <Skyline className="hc-footer__skyline" />
      </div>

      {/* ── 2. Main Footer Content (5 Columns) ────────────────────────────── */}
      <div className="hc-footer__main">
        <div className="container">
          <div className="hc-footer__grid">
            {/* Column 1: Center Identity */}
            <div className="hc-footer__col hc-footer__col--identity">
              <Link href={href('/')} className="hc-footer__logo-badge" aria-label={site.name}>
                <img
                  src="/brand/logo.svg"
                  alt={site.name}
                  width={180}
                  height={42}
                  className="hc-footer__logo-img"
                />
              </Link>

              <h3 className="hc-footer__brand-title">
                {site.name}
              </h3>

              <p className="hc-footer__brand-desc">
                {fullDescription}
              </p>

              <div className="hc-footer__social-block">
                <div className="hc-footer__social-list">
                  {links.filter((l) => l.url).map((l) => (
                    <a
                      key={l.label}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hc-footer__social-btn"
                      aria-label={`${l.label} (${t('a11y.newWindow')})`}
                      title={l.label}
                    >
                      <SocialIcon name={l.name} />
                    </a>
                  ))}
                </div>

                {whatsapp.length > 0 && (
                  <div className="hc-footer__wa-list">
                    {whatsapp.map((w) => (
                      <a
                        key={w.number}
                        className="hc-footer__wa-pill"
                        href={`https://wa.me/${w.number.replace(/[^0-9]/g, '').replace(/^0+/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${w.label ?? ''} ${w.number} (${t('a11y.newWindow')})`}
                        title={`WhatsApp ${w.label ?? ''} ${w.number}`}
                      >
                        <SocialIcon name="whatsapp" className="hc-footer__wa-icon" />
                        <span>{w.label ? `واتساب ${w.label}` : w.number}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Browse (تصفّح) */}
            <nav className="hc-footer__col hc-footer__col--nav" aria-label={t('footer.explore')}>
              <h3 className="hc-footer__col-heading">
                <span className="hc-footer__col-heading-line" aria-hidden="true" />
                <span>{t('footer.explore')}</span>
              </h3>
              <ul className="hc-footer__links-menu">
                {browseLinks.map((item) => (
                  <li key={item.path} className="hc-footer__links-item">
                    <Link href={href(item.path)} className="hc-footer__nav-link">
                      <span className="hc-footer__nav-dot" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 3: Research Tools (أدوات الباحث) */}
            <nav className="hc-footer__col hc-footer__col--nav" aria-label={t('footer.research')}>
              <h3 className="hc-footer__col-heading">
                <span className="hc-footer__col-heading-line" aria-hidden="true" />
                <span>{t('footer.research')}</span>
              </h3>
              <ul className="hc-footer__links-menu">
                {researchLinks.map((item) => (
                  <li key={item.path} className="hc-footer__links-item">
                    {item.isRss ? (
                      <a href={item.path} className="hc-footer__nav-link hc-footer__nav-link--rss">
                        <Icon name="rss" className="hc-footer__rss-icon" />
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <Link href={href(item.path)} className="hc-footer__nav-link">
                        <span className="hc-footer__nav-dot" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 4: Center Info (المركز) */}
            <nav className="hc-footer__col hc-footer__col--nav" aria-label={t('footer.about')}>
              <h3 className="hc-footer__col-heading">
                <span className="hc-footer__col-heading-line" aria-hidden="true" />
                <span>{t('footer.about')}</span>
              </h3>
              <ul className="hc-footer__links-menu">
                {centerLinks.map((item) => (
                  <li key={item.path} className="hc-footer__links-item">
                    <Link href={href(item.path)} className="hc-footer__nav-link">
                      <span className="hc-footer__nav-dot" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 5: Contact Info (تواصل معنا) */}
            <div className="hc-footer__col hc-footer__col--contact">
              <h3 className="hc-footer__col-heading">
                <span className="hc-footer__col-heading-line" aria-hidden="true" />
                <span>{t('contact.title')}</span>
              </h3>
              <div className="hc-footer__contact-items">
                {/* Address */}
                <div className="hc-footer__contact-card">
                  <div className="hc-footer__contact-icon" aria-hidden="true">
                    <Icon name="pin" />
                  </div>
                  <div className="hc-footer__contact-body">
                    <span className="hc-footer__contact-tag">{ctx.lang.code === 'ar' ? 'المقر والعنوان' : t('contact.address')}</span>
                    <address className="hc-footer__contact-text">
                      {site.address || 'عمارة باشريف، بجانب مسجد الغالبي، حي الشهيد خالد، المكلا، الجمهورية اليمنية'}
                    </address>
                  </div>
                </div>

                {/* Email */}
                <div className="hc-footer__contact-card">
                  <div className="hc-footer__contact-icon" aria-hidden="true">
                    <Icon name="mail" />
                  </div>
                  <div className="hc-footer__contact-body">
                    <span className="hc-footer__contact-tag">{ctx.lang.code === 'ar' ? 'البريد الإلكتروني الرسمي' : t('contact.email')}</span>
                    <a
                      href={`mailto:${site.email || 'info@hadramout.center'}`}
                      className="hc-footer__contact-email-link"
                      dir="ltr"
                    >
                      {site.email || 'info@hadramout.center'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Copyright and Bottom Legal Bar ──────────────────────────────── */}
      <div className="hc-footer__bottom-bar">
        <div className="container hc-footer__bottom-container">
          <p className="hc-footer__copy-text">
            © {new Date().getFullYear()} {site.name} — {t('footer.rights')}
          </p>
          <p className="hc-footer__dev-text">
            <span>{t('footer.built')}</span>{' '}
            <a
              href="https://novixa.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hc-footer__dev-link"
            >
              Novixa
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
