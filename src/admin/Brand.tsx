/**
 * The Center's identity in the admin, in place of Payload's mark: `Logo` on the login/forgot screens, `Icon` in the
 * header breadcrumb. Server components; the language comes from the admin's interface language.
 */
interface GraphicProps {
  i18n?: { language?: string };
}

const NAME = {
  ar: { name: 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر', sub: 'لوحة التحكم' },
  en: { name: 'Hadhramout Center for Historical Studies, Documentation and Publishing', sub: 'Content administration' },
};

export function Logo({ i18n }: GraphicProps) {
  const t = NAME[i18n?.language === 'en' ? 'en' : 'ar'];
  return (
    <span className="hc-logo">
      {/* decorative: the name next to it is the accessible label */}
      <img src="/brand/logo-icon.svg" alt="" width={44} height={79} className="hc-logo__mark" />
      <span className="hc-logo__text">
        <span className="hc-logo__name">{t.name}</span>
        <span className="hc-logo__sub">{t.sub}</span>
      </span>
    </span>
  );
}

export function Icon({ i18n }: GraphicProps) {
  const t = NAME[i18n?.language === 'en' ? 'en' : 'ar'];
  return <img src="/brand/logo-icon.svg" alt={t.name} width={14} height={25} className="hc-icon" />;
}
