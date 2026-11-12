import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, authorsOf, docHref, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { formatMoney } from '../../../../lib/money.ts';
import { receiptLabels, storeLabels } from '../../../../lib/platform-labels.ts';
import { canOrder } from '../../../../lib/platform-requests.ts';
import type { Doc } from '../../../../lib/data.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { Cover } from '../../../../components/Cards.tsx';
import { AddToCart, CartPanel } from '../../../../components/client/StoreCart.tsx';
import { ReceiptForm } from '../../../../components/client/PlatformForms.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/store', title: ctx.t('store.title'), description: ctx.t('store.lead'), card: { key: 'store' } });
}

async function storeBooks(lang: string): Promise<Doc[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'books',
    where: { and: [{ status: { equals: 'published' } }, { or: [{ storeStatus: { not_equals: 'hidden' } }, { storeStatus: { exists: false } }] }] },
    sort: '-year',
    limit: 500,
    pagination: false,
    depth: 1,
    locale: lang as never,
    fallbackLocale: 'ar',
    overrideAccess: false,
    select: { body: false } as never,
  });
  return res.docs as unknown as Doc[];
}

/**
 * «المتجر الإلكتروني»: the Center's own publications, ordered by request. The site takes no payment: staff answer each order with
 * availability, price and how to pay, so nothing here promises a stock or a price the Center has not set in the admin.
 */
export default async function StorePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const books = await storeBooks(locale);
  const crumbs = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${lang.code}`) },
    { name: t('store.title'), url: absolute(`/${lang.code}/store`) },
  ]);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('store.title') }]} title={t('store.title')} lead={t('store.lead')} />
      <div className="container section">
        <p className="notice notice--info store-note">{t('store.howItWorks')}</p>
        <section id="cart" className="info-section store-cart" aria-labelledby="cart-h">
          <h2 id="cart-h" tabIndex={-1}>{t('store.cart')}</h2>
          <CartPanel lang={lang.code} labels={storeLabels(ctx)} privacyHref={href('/privacy')} booksHref="#books" />
        </section>
        <section id="books" aria-labelledby="books-h" className="store-books">
          <h2 id="books-h">{t('store.books', { n: books.length })}</h2>
          <div className="grid grid--books">
            {books.map((doc) => {
              const authors = authorsOf(doc);
              const status = doc.storeStatus as string | undefined;
              const price = typeof doc.price === 'number' ? (doc.currency ? formatMoney(doc.price, doc.currency as string, lang.code) : String(doc.price)) : t('store.priceOnRequest');
              return (
                <article key={doc.id} className="book">
                  <div className="book__cover">
                    <Cover doc={doc} sizes="(max-width: 640px) 44vw, 200px" fallbackLabel={doc.title} decorative />
                  </div>
                  <div className="stack store-book">
                    <h3 className="book__title"><Link prefetch={false} href={docHref(ctx, 'book', doc.id)}>{doc.title}</Link></h3>
                    {authors.length ? <p className="book__author" dir="auto">{new Intl.ListFormat(lang.code, { type: 'conjunction' }).format(authors.map((a) => (a.honorific ? `${a.honorific} ` : '') + a.name))}</p> : null}
                    <p className="book__meta">{status === 'out_of_stock' ? t('store.outOfStock') : price}</p>
                    {canOrder(status) ? <AddToCart id={doc.id} title={doc.title} add={t('store.add')} added={t('store.added')} remove={t('store.remove')} cartHref="#cart" viewCart={t('store.viewCart')} /> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <section id="receipt" className="info-section store-receipt" aria-labelledby="receipt-h">
          <h2 id="receipt-h">{t('receipt.title')}</h2>
          <p>{t('receipt.leadStore')}</p>
          <ReceiptForm lang={lang.code} labels={receiptLabels(ctx)} />
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
