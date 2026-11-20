import { absolute, type Ctx } from '../lib/ctx.ts';
import { breadcrumbJsonLd, jsonLdString } from '../lib/jsonld.ts';

/** BreadcrumbList for a one-level page (Home › page), as every other listing page emits; `path` without the language. */
export function CrumbsJsonLd({ ctx, name, path }: { ctx: Ctx; name: string; path: string }) {
  const data = breadcrumbJsonLd([
    { name: ctx.t('nav.home'), url: absolute(`/${ctx.lang.code}`) },
    { name, url: absolute(`/${ctx.lang.code}${path}`) },
  ]);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
