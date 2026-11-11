import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx, type Ctx } from '../../../../lib/ctx.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { currentMember, requestsOf, type MemberRequests } from '../../../../lib/members.ts';
import { accountLabels } from '../../../../lib/platform-labels.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { DeleteAccount, PasswordForm, ProfileForm, SavedSync, SignIn, SignOut } from '../../../../components/client/AccountForms.tsx';

type Props = { params: Promise<{ locale: string }> };

// reads the visitor's session cookie: never prerendered or shared between visitors
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/account', title: ctx.t('account.title'), description: ctx.t('account.lead'), card: { key: 'platforms' }, noindex: true });
}

function day(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : lang, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
}

function Requests({ ctx, requests }: { ctx: Ctx; requests: MemberRequests }) {
  const { t, lang, href } = ctx;
  // an order or a pledge can carry a receipt photo: its newest one's state, or a link to send one while the request is open
  const receipt = (reference: string, status: string, page: '/store' | '/donate') => {
    const sent = requests.receipts[reference];
    if (sent) return t(`receipt.status.${sent}`);
    if (status === 'cancelled') return '';
    return <Link prefetch={false} href={`${href(page)}?ref=${encodeURIComponent(reference)}#receipt`}>{t('receipt.upload')}</Link>;
  };
  const rows = [
    ...requests.orders.map((r) => ({
      key: r.reference,
      kind: t('account.req.order'),
      detail: (r.items ?? []).map((i) => (i.quantity && i.quantity > 1 ? `${i.title} × ${i.quantity}` : i.title)).join('، '),
      status: t(`account.status.${r.status}`),
      receipt: receipt(r.reference, r.status, '/store'),
      at: r.createdAt,
    })),
    ...requests.pledges.map((r) => ({
      key: r.reference,
      kind: t('account.req.pledge'),
      detail: r.amount ? `${r.amount} ${r.currency ?? ''}`.trim() : '',
      status: t(`account.status.${r.status}`),
      receipt: receipt(r.reference, r.status, '/donate'),
      at: r.createdAt,
    })),
    ...requests.volunteers.map((r) => ({ key: r.reference, kind: t('account.req.volunteer'), detail: '', status: t(`account.status.${r.status}`), receipt: '' as ReactNode, at: r.createdAt })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  if (rows.length === 0) return <p className="empty-state">{t('account.noRequests')}</p>;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">{t('forms.reference')}</th>
            <th scope="col">{t('account.req.kind')}</th>
            <th scope="col">{t('account.req.detail')}</th>
            <th scope="col">{t('account.req.date')}</th>
            <th scope="col">{t('account.req.status')}</th>
            <th scope="col">{t('account.req.receipt')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td dir="ltr" translate="no">{r.key}</td>
              <td>{r.kind}</td>
              <td>{r.detail}</td>
              <td>{day(r.at, lang.code)}</td>
              <td>{r.status}</td>
              <td>{r.receipt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** «تسجيل دخول الأعضاء»: a reader's own space. It opens nothing in the admin and is separate from staff accounts. */
export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const labels = accountLabels(ctx);
  const member = await currentMember();
  const crumbs = [{ name: t('account.title') }];

  if (!member) {
    return (
      <>
        <PageHead ctx={ctx} crumbs={crumbs} title={t('account.title')} lead={t('account.lead')} />
        <div className="container container--narrow section info-page">
          <SignIn labels={labels} privacyHref={href('/privacy')} />
          <section className="info-section" aria-labelledby="benefits-h">
            <h2 id="benefits-h">{t('account.benefitsTitle')}</h2>
            <ul>
              <li>{t('account.benefit1')}</li>
              <li>{t('account.benefit2')}</li>
              <li>{t('account.benefit3')}</li>
            </ul>
          </section>
        </div>
      </>
    );
  }

  const requests = await requestsOf(member.id);
  return (
    <>
      <PageHead ctx={ctx} crumbs={crumbs} title={t('account.welcome', { name: member.name })} lead={member.email} />
      <div className="container container--narrow section info-page">
        <section className="info-section" aria-labelledby="requests-h">
          <h2 id="requests-h">{t('account.requests')}</h2>
          <Requests ctx={ctx} requests={requests} />
          <div className="cluster">
            <Link prefetch={false} className="btn btn--secondary btn--sm" href={href('/store')}>{t('store.title')}</Link>
            <Link prefetch={false} className="btn btn--secondary btn--sm" href={href('/donate')}>{t('donate.title')}</Link>
            <Link prefetch={false} className="btn btn--secondary btn--sm" href={href('/volunteer')}>{t('volunteer.title')}</Link>
          </div>
        </section>
        <section className="info-section" aria-labelledby="saved-h">
          <h2 id="saved-h">{t('saved.title')}</h2>
          <p>{t('account.savedNote')}</p>
          <SavedSync labels={labels} />
          <p><Link prefetch={false} href={href('/saved')}>{t('account.savedOpen')}</Link></p>
        </section>
        <section className="info-section" aria-labelledby="profile-h">
          <h2 id="profile-h">{t('account.profile')}</h2>
          <ProfileForm labels={labels} name={member.name} phone={member.phone} />
        </section>
        <section className="info-section" aria-labelledby="security-h">
          <h2 id="security-h">{t('account.security')}</h2>
          <PasswordForm labels={labels} />
          <SignOut label={t('account.logout')} />
          <DeleteAccount labels={labels} />
        </section>
      </div>
    </>
  );
}
