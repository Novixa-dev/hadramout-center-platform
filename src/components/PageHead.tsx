import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Ctx } from '../lib/ctx.ts';

export interface Crumb {
  name: string;
  path?: string;
}

/** Breadcrumb trail. The last item is the current page (no link, aria-current). */
export function Breadcrumbs({ ctx, items }: { ctx: Ctx; items: Crumb[] }) {
  const { t, href } = ctx;
  return (
    <nav className="breadcrumbs" aria-label={t('a11y.breadcrumb')}>
      <ol>
        <li><Link href={href('/')}>{t('nav.home')}</Link></li>
        {items.map((c, i) => (
          <li key={`${c.name}-${i}`}>{c.path && i < items.length - 1 ? <Link href={href(c.path)}>{c.name}</Link> : <span aria-current={i === items.length - 1 ? 'page' : undefined}>{c.name}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

/** Heading band of an inner page: breadcrumbs, the one <h1>, an optional lead and extra content (actions, stats). */
export function PageHead({ ctx, crumbs, title, lead, children, titleAttrs }: { ctx: Ctx; crumbs: Crumb[]; title: string; lead?: ReactNode; children?: ReactNode; titleAttrs?: { lang?: string; dir?: 'rtl' | 'ltr' } }) {
  return (
    <div className="page-head">
      <div className="container page-head__container">
        {crumbs.length ? <Breadcrumbs ctx={ctx} items={crumbs} /> : null}
        <div className="page-head__title-wrap">
          <h1 className="page-head__title" {...titleAttrs}>{title}</h1>
          <span className="page-head__underline" aria-hidden="true" />
        </div>
        {lead ? <p className="page-head__lead">{lead}</p> : null}
        {children}
      </div>
    </div>
  );
}
