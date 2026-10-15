import type { SVGProps } from 'react';

const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 4 5.7 4 9s-1.4 6.3-4 9c-2.6-2.7-4-5.7-4-9s1.4-6.3 4-9Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  quote: <path d="M9 7H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3v2a3 3 0 0 1-3 3M20 7h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3v2a3 3 0 0 1-3 3" />,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  print: <><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" /></>,
  download: <><path d="M12 3v12m0 0-4-4m4 4 4-4" /><path d="M4 19h16" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  up: <path d="m6 14 6-6 6 6" />,
  play: <path d="M8 5v14l11-7L8 5Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  rss: <><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.5" /></>,
  textsize: <path d="M4 19 9 5l5 14M6 14h6M16 19l2.5-7 2.5 7M17 17h3" />,
  check: <path d="m5 12 5 5 9-10" />,
  down: <path d="m6 9 6 6 6-6" />,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
  external: <path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'icon', ...rest }: { name: IconName; className?: string } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {PATHS[name]}
    </svg>
  );
}
