/**
 * The site's navigation in the order the Center asked for (feedback report 2026-10-27, «شريط القائمة الرئيسية»):
 * Home · About · Governance · Media centre · Research · Programmes · Digital platforms · Contact.
 * One tree drives the desktop menu, the phone drawer and the footer; labels are message keys, paths are locale-free.
 * Items the Center marked «تحت الإنشاء» lead to pages that say so (never to a 404).
 */
export interface NavLink {
  key: string;
  path: string;
}
export interface NavGroup {
  key: string;
  items: (NavLink | NavGroup)[];
}
export type NavEntry = NavLink | NavGroup;

export const isGroup = (e: NavEntry): e is NavGroup => 'items' in e;

export const NAV_TREE: NavEntry[] = [
  { key: 'nav.home', path: '/' },
  {
    key: 'nav.g.about',
    items: [
      { key: 'nav.about.overview', path: '/about' },
      { key: 'nav.about.chairman', path: '/about/chairman-message' },
      { key: 'nav.about.context', path: '/about/context' },
      { key: 'nav.about.identity', path: '/about/identity' },
      { key: 'nav.about.structure', path: '/about/structure' },
      { key: 'nav.about.board', path: '/about/board' },
      { key: 'nav.about.team', path: '/about/team' },
      { key: 'nav.about.advisors', path: '/about/advisors' },
      { key: 'nav.about.committees', path: '/about/committees' },
      {
        key: 'nav.g.journey',
        items: [
          { key: 'nav.about.decade', path: '/decade' },
          { key: 'nav.about.future', path: '/future-plan' },
          { key: 'nav.about.documents', path: '/about/documents' },
          { key: 'nav.about.mediawork', path: '/about/media-work' },
          { key: 'nav.about.achievements', path: '/about/achievements' },
          { key: 'nav.about.outreach', path: '/about/outreach' },
        ],
      },
    ],
  },
  {
    key: 'nav.g.governance',
    items: [
      { key: 'nav.gov.regulations', path: '/governance/regulations' },
      { key: 'nav.gov.policies', path: '/governance/policies' },
      { key: 'nav.gov.reports', path: '/governance/annual-reports' },
    ],
  },
  {
    key: 'nav.g.media',
    items: [
      { key: 'nav.news', path: '/news' },
      { key: 'nav.audio', path: '/audio' },
      { key: 'nav.videos', path: '/videos' },
      { key: 'nav.announcements', path: '/announcements' },
      { key: 'nav.partners', path: '/partners' },
      { key: 'nav.testimonials', path: '/testimonials' },
    ],
  },
  {
    key: 'nav.g.research',
    items: [
      { key: 'nav.studies', path: '/studies' },
      { key: 'nav.articles.only', path: '/articles' },
      { key: 'nav.topics', path: '/topics' },
      { key: 'nav.authors', path: '/authors' },
      { key: 'nav.timeline', path: '/timeline' },
      {
        key: 'nav.g.contribution',
        items: [
          { key: 'nav.submit.standards', path: '/submit#standards' },
          { key: 'nav.submit.ethics', path: '/submit#ethics' },
          { key: 'nav.submit.ai', path: '/submit#ai' },
          { key: 'nav.submit.review', path: '/submit#review' },
          { key: 'nav.submit.send', path: '/submit#send' },
        ],
      },
    ],
  },
  {
    key: 'nav.g.programs',
    items: [
      {
        key: 'nav.g.events',
        items: [
          { key: 'nav.events.all', path: '/events' },
          { key: 'nav.events.conference', path: '/events?kind=conference' },
          { key: 'nav.events.seminar', path: '/events?kind=seminar' },
          { key: 'nav.events.panel', path: '/events?kind=panel' },
          { key: 'nav.events.lecture', path: '/events?kind=lecture' },
          { key: 'nav.events.virtual', path: '/events?kind=virtual' },
          { key: 'nav.events.competition', path: '/events?kind=competition' },
        ],
      },
      {
        key: 'nav.g.publications',
        items: [
          { key: 'nav.magazines', path: '/magazines' },
          { key: 'nav.books', path: '/books' },
        ],
      },
      { key: 'nav.forum', path: '/forum' },
      { key: 'nav.podcast', path: '/podcast' },
      { key: 'nav.exhibition', path: '/projects-exhibition' },
    ],
  },
  {
    key: 'nav.g.platforms',
    items: [
      { key: 'nav.platforms.members', path: '/account' },
      { key: 'nav.platforms.store', path: '/store' },
      { key: 'nav.platforms.khizana', path: '/digital-library' },
      { key: 'nav.platforms.encyclopedia', path: '/encyclopedia' },
      { key: 'nav.platforms.cultural', path: '/culture' },
      { key: 'nav.platforms.donations', path: '/donate' },
      { key: 'nav.platforms.volunteering', path: '/volunteer' },
      { key: 'nav.platforms.overview', path: '/platforms' },
    ],
  },
  { key: 'nav.contact', path: '/contact' },
];

/** The utility bar above the header (report, «شريط القائمة الفرعية»); the language list sits at its end. */
export const UTILITY_LINKS: (NavLink & { icon: 'cart' | 'user' | 'edit' | 'book' | 'heart' })[] = [
  { key: 'util.store', path: '/store#cart', icon: 'cart' },
  { key: 'util.members', path: '/account', icon: 'user' },
  { key: 'util.research', path: '/submit#send', icon: 'edit' },
  { key: 'util.magazine', path: '/submit#magazine', icon: 'book' },
  { key: 'util.support', path: '/support', icon: 'heart' },
];

/** Every distinct locale-free page path in the tree (without #fragment), for link checks and tests. */
export function navPaths(entries: NavEntry[] = NAV_TREE): string[] {
  const out = new Set<string>();
  const walk = (list: NavEntry[]) => {
    for (const e of list) {
      if (isGroup(e)) walk(e.items);
      else out.add(e.path.split('#')[0] as string);
    }
  };
  walk(entries);
  for (const u of UTILITY_LINKS) out.add(u.path.split('#')[0] as string);
  return [...out];
}

/** Every message key the tree uses (for the "every key exists" test). */
export function navKeys(entries: NavEntry[] = NAV_TREE): string[] {
  const out: string[] = [];
  const walk = (list: NavEntry[]) => {
    for (const e of list) {
      out.push(e.key);
      if (isGroup(e)) walk(e.items);
    }
  };
  walk(entries);
  return [...out, ...UTILITY_LINKS.map((u) => u.key)];
}

/**
 * Pages replaced by a fuller one when the two client passes were merged (2026-11-08). Their rows stay as drafts, so nothing an
 * editor wrote is lost; the old addresses keep working. `partnerships` listed a misread partner name, `/partners` is checked against the book.
 */
export const MOVED_PAGES: Record<string, string> = {
  'vision-mission': '/about/identity',
  'strategic-goals': '/about/identity',
  organization: '/about/structure',
  partnerships: '/partners',
  'about/milestones': '/decade',
};
