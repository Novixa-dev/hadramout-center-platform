import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { Icon } from '../../../../components/Icon.tsx';
import { ContactForm } from '../../../../components/client/ContactForm.tsx';

export const dynamic = 'force-dynamic'; // reads searchParams

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/contact', title: ctx.t('contact.title'), description: ctx.t('contact.lead') });
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t } = ctx;
  const sp = await searchParams;
  const site = await getSite(locale);
  const kind = ['book_request', 'translation_issue'].includes(one(sp.kind)) ? one(sp.kind) : 'contact';
  const wa = (site.whatsapp ?? []).filter((w) => w.number);
  return (
    <>
      <div className="page-head"><div className="container"><h1>{t('contact.title')}</h1><p>{t('contact.lead')}</p></div></div>
      <div className="container section grid grid--wide" style={{ paddingBlockStart: 'var(--space-6)', alignItems: 'start' }}>
        <div className="stack">
          {site.address ? <p><Icon name="pin" /> <strong>{t('contact.address')}:</strong> {site.address}</p> : null}
          {site.email ? <p><Icon name="mail" /> <strong>{t('contact.email')}:</strong> <a href={`mailto:${site.email}`}>{site.email}</a></p> : null}
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
        <ContactForm
          lang={locale}
          kind={kind}
          subject={one(sp.subject)}
          pageUrl={one(sp.page)}
          bookId={one(sp.book)}
          labels={{ name: t('contact.form.name'), email: t('contact.form.email'), phone: t('contact.form.phone'), subject: t('contact.form.subject'), message: t('contact.form.message'), send: t('contact.form.send'), ok: t('contact.form.sent'), error: t('contact.form.error'), limit: t('contact.form.limit') }}
        />
      </div>
    </>
  );
}
