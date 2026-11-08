import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { Listing } from '../../../../components/Listing.tsx';
import { PageHead } from '../../../../components/PageHead.tsx';

// reads the query string, so it cannot be the static page the locale layout's generateStaticParams would make of it
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The category the migrated magazine archive files its studies under (the Center's menu lists «دراسات» apart from «مقالات»). */
const STUDIES_CATEGORY = 'دراسات';

async function studiesCategoryId(): Promise<number | null> {
  const payload = await getPayloadClient();
  const found = await payload.find({ collection: 'categories', where: { name: { equals: STUDIES_CATEGORY } }, locale: 'ar', limit: 1, depth: 0, pagination: false, overrideAccess: true });
  return (found.docs[0]?.id as number | undefined) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/studies', title: ctx.t('nav.studies'), description: ctx.t('studies.lead') });
}

export default async function StudiesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t } = ctx;
  const [sp, id] = await Promise.all([searchParams, studiesCategoryId()]);
  const title = t('nav.studies');
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: title }]} title={title} lead={t('studies.lead')} />
      <Listing ctx={ctx} type="article" basePath="/studies" searchParams={sp} fixed={id ? { category: id } : undefined} hide={['topic']} title={title} crumbs={[]} description={t('studies.lead')} />
    </>
  );
}
