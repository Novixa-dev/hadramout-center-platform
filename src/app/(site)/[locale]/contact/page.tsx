import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { Icon } from '../../../../components/Icon.tsx';
import { PageHead } from '../../../../components/PageHead.tsx';
import { ContactForm } from '../../../../components/client/ContactForm.tsx';

export const dynamic = 'force-dynamic'; // reads searchParams

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/contact', title: ctx.t('contact.title'), description: ctx.t('contact.lead'), card: { key: 'contact' } });
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, lang } = ctx;
  const sp = await searchParams;
  const site = await getSite(locale);
  const kind = ['book_request', 'translation_issue'].includes(one(sp.kind)) ? one(sp.kind) : 'contact';
  const wa = (site.whatsapp ?? []).filter((w) => w.number);
  const ld = { '@context': 'https://schema.org', '@type': 'ContactPage', url: absolute(`/${lang.code}/contact`), name: t('contact.title'), inLanguage: lang.tag };
  const crumbs = breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${lang.code}`) }, { name: t('contact.title'), url: absolute(`/${lang.code}/contact`) }]);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('contact.title') }]} title={t('contact.title')} lead={t('contact.lead')} />
      <div className="container section contact-grid" data-aos="fade-up">
        <div className="box stack" style={{ '--stack': '1.1rem' } as React.CSSProperties}>
          {site.address ? <p style={{ display: 'flex', gap: '0.6rem' }}><Icon name="pin" /><span><strong>{t('contact.address')}</strong><br />{site.address}</span></p> : null}
          {site.email ? <p style={{ display: 'flex', gap: '0.6rem' }}><Icon name="mail" /><span><strong>{t('contact.email')}</strong><br /><a href={`mailto:${site.email}`} style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}>{site.email}</a></span></p> : null}
          {wa.length ? (
            <div>
              <p><strong>{t('contact.whatsapp')}</strong></p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.4rem', marginBlockStart: '0.4rem' }}>
                {wa.map((w) => (
                  <li key={w.number}><a className="btn btn--secondary btn--sm" href={`https://wa.me/${w.number.replace(/\D/g, '').replace(/^00/, '')}`} target="_blank" rel="noopener noreferrer"><span dir="ltr">+{w.number.replace(/^00/, '')}</span> {w.label ? `(${w.label})` : ''}</a></li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="box">
          <ContactForm
            lang={locale}
            kind={kind}
            subject={one(sp.subject)}
            pageUrl={one(sp.page)}
            bookId={one(sp.book)}
            labels={{ name: t('contact.form.name'), email: t('contact.form.email'), phone: t('contact.form.phone'), subject: t('contact.form.subject'), message: t('contact.form.message'), send: t('contact.form.send'), ok: t('contact.form.sent'), error: t('contact.form.error'), limit: t('contact.form.limit') }}
          />
        </div>
      </div>
      {[ld, crumbs].map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(j) }} />)}
    </>
  );
}
