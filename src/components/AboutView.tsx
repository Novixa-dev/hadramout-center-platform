import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { Icon, type IconName } from './Icon.tsx';

interface AboutViewProps {
  ctx: Ctx;
  page: { id: number; title: string; body?: string };
  pendingApproval: boolean;
}

interface WorkDomain {
  icon: IconName;
  tag: string;
  title: string;
  description: string;
}

interface ProgramItem {
  icon: IconName;
  tag: string;
  title: string;
  description: string;
  href: string;
  actionText: string;
}

export function AboutView({ ctx, pendingApproval }: AboutViewProps) {
  const { t, href, lang } = ctx;
  const isAr = lang.code === 'ar';

  const workDomains: WorkDomain[] = isAr
    ? [
        {
          icon: 'book',
          tag: 'أبحاث محكّمة',
          title: 'الدراسات والبحوث التاريخية',
          description: 'دراسات محكَّمة في تاريخ حضرموت القديم والإسلامي والحديث، وفي أعلامها وحضارتها وتراثها الإنساني والفكري.',
        },
        {
          icon: 'manuscript',
          tag: 'أرشفة وتوثيق',
          title: 'التوثيق التاريخي',
          description: 'توثيق الأحداث والوثائق النادرة والمخطوطات والشخصيات والفعاليات الثقافية والعلمية بدقة وأمانة منهجية.',
        },
        {
          icon: 'globe',
          tag: 'تواصل حضاري',
          title: 'الترجمة ونقل المعرفة',
          description: 'نقل ما كُتب عن حضرموت بلغات العالم المختلفة إلى اللغة العربية لمد جسور الحوار والتواصل المعرفي.',
        },
        {
          icon: 'layers',
          tag: 'نشر أكاديمي',
          title: 'النشر العلمي والطباعة',
          description: 'إصدار الكتب العلمية الرصينة ومجلة حضرموت الثقافية وفق أعلى المعايير التحريرية والتصميمية.',
        },
      ]
    : [
        {
          icon: 'book',
          tag: 'Peer-reviewed Research',
          title: 'Historical Studies & Research',
          description: 'Peer-reviewed studies on ancient, Islamic, and modern Hadhramout history, its prominent figures, and cultural contributions.',
        },
        {
          icon: 'manuscript',
          tag: 'Archiving & Records',
          title: 'Documentation',
          description: 'Documenting events, historical documents, manuscripts, notable personalities, and cultural-scientific milestones.',
        },
        {
          icon: 'globe',
          tag: 'Cross-cultural Exchange',
          title: 'Translation',
          description: 'Translating global literature and records about Hadhramout into Arabic to enrich historical scholarship.',
        },
        {
          icon: 'layers',
          tag: 'Academic Publishing',
          title: 'Publishing',
          description: 'Publishing specialized academic books and the Hadhramout Cultural Journal under rigorous editorial standards.',
        },
      ];

  const programs: ProgramItem[] = isAr
    ? [
        {
          icon: 'book',
          tag: 'فصلية محكّمة',
          title: 'مجلة حضرموت الثقافية',
          description: 'مجلة دورية تضم الدراسات والقراءات والحوارات والترجمات والإبداع الفكري والتراثي.',
          href: href('/magazines'),
          actionText: 'تصفح أعداد المجلة',
        },
        {
          icon: 'briefcase',
          tag: 'مكتبة المركز',
          title: 'إصدارات الكتب',
          description: 'مؤلفات وتحقيقات وأعمال مؤتمرات علمية ورسائل تاريخية نادرة توثق الذاكرة الحضرمية.',
          href: href('/books'),
          actionText: 'استكشاف الكتب',
        },
        {
          icon: 'calendar',
          tag: 'لقاءات علمية',
          title: 'المؤتمرات والندوات',
          description: 'مؤتمرات علمية وندوات وحلقات نقاش وفعاليات ثقافية جامعة لنخبة من المؤرخين والباحثين.',
          href: href('/events'),
          actionText: 'جدول الفعاليات',
        },
        {
          icon: 'users',
          tag: 'صالون دوري',
          title: 'منتدى عميد الوفاء الثقافي',
          description: 'لقاءات ومحاضرات ثقافية دورية، يستلهم فكرته من ندوة الوفاء التي كان يقيمها الشيخ أحمد محمد باجنيد (رحمه الله) بمدينة الرياض.',
          href: href('/forum'),
          actionText: 'أرشيف المنتدى',
        },
        {
          icon: 'play',
          tag: 'إنتاج مرئي',
          title: 'المرئيات والتوثيق المصور',
          description: 'برنامج «كاتب وكتاب» وتسجيلات الفعاليات والمحاضرات المصورة بجودة عالية وتوثيق حي.',
          href: href('/videos'),
          actionText: 'مشاهدة المرئيات',
        },
      ]
    : [
        {
          icon: 'book',
          tag: 'Quarterly Journal',
          title: 'Hadhramout Cultural Journal',
          description: 'A periodical journal featuring studies, critical reviews, interviews, translations, and intellectual thought.',
          href: href('/magazines'),
          actionText: 'Browse Journal Issues',
        },
        {
          icon: 'briefcase',
          tag: 'Center Library',
          title: 'Book Publications',
          description: 'Authored books, scholarly investigations, conference proceedings, and rare historical monographs.',
          href: href('/books'),
          actionText: 'Explore Books',
        },
        {
          icon: 'calendar',
          tag: 'Conferences & Seminars',
          title: 'Conferences and Seminars',
          description: 'Scholarly conferences, academic seminars, and cultural symposiums bringing together historians and scholars.',
          href: href('/events'),
          actionText: 'View Events',
        },
        {
          icon: 'users',
          tag: 'Cultural Forum',
          title: 'Ameed Al-Wafa Cultural Forum',
          description: 'Periodic cultural lectures and dialogues, inspired by the Al-Wafa salon held by Sheikh Ahmed Mohammed Bajunaid in Riyadh.',
          href: href('/forum'),
          actionText: 'Forum Archive',
        },
        {
          icon: 'play',
          tag: 'Media Production',
          title: 'Media & Video Gallery',
          description: 'The "Writer and Book" programme and live recordings of symposiums, lectures, and cultural ceremonies.',
          href: href('/videos'),
          actionText: 'Watch Media',
        },
      ];

  return (
    <div className="about-page-wrapper container section">
      {pendingApproval ? (
        <p className="notice notice--warn" role="note" data-review-notice style={{ marginBlockEnd: 'var(--space-6)' }}>
          <Icon name="info" /> {t('review.pendingApproval')}
        </p>
      ) : null}

      {/* Component 1 — The Intro Statement (Kept intact as requested) */}
      <section className="about-intro-section" aria-label={isAr ? 'عن المركز' : 'About the Center'} data-aos="fade-up">
        <div className="about-intro-card">
          <div className="about-intro-accent-bar" aria-hidden="true" />
          <p className="about-intro-lead">
            {isAr ? (
              <>
                يُعدّ <strong>مركز حضرموت للدراسات التاريخية والتوثيق والنشر</strong> من المراكز العلمية المستقلة، يمارس نشاطه في مجالات الدراسات والبحوث التاريخية والترجمة والتوثيق والنشر، ويخصّص حيّزاً كبيراً من نشاطه العلمي لدراسة تاريخ حضرموت وحضارتها وأعلامها.
              </>
            ) : (
              <>
                The <strong>Hadhramout Center for Historical Studies, Documentation and Publishing</strong> is an independent academic institution active in historical research, translation, documentation, and publishing, dedicating a significant portion of its scholarly focus to the history, civilization, and notable figures of Hadhramout.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Components 2 & 3 — Side by Side in ONE ROW */}
      <div className="about-row" data-aos="fade-up" data-aos-delay="100">
        {/* Column 1: مجالات العمل */}
        <section className="about-col" aria-labelledby="about-domains-heading">
          <div className="about-col__head">
            <div className="about-col__icon-wrap" aria-hidden="true">
              <Icon name="rosette" className="about-col__icon" />
            </div>
            <div className="about-col__head-info">
              <span className="about-col__badge">
                {isAr ? 'المسارات المعرفية والبحثية' : 'Research & Knowledge Tracks'}
              </span>
              <h2 id="about-domains-heading" className="about-col__title">
                {isAr ? 'مجالات العمل' : 'Fields of Work'}
              </h2>
            </div>
          </div>
          <p className="about-col__lead">
            {isAr
              ? 'الميادين الأساسية التي يكرّس المركز جهوده العلمية والتوثيقية للبحث والتحقيق فيها:'
              : 'Core scholarly areas where the Center focuses its historical research and archiving:'}
          </p>

          <div className="about-card-list">
            {workDomains.map((item, idx) => (
              <article key={idx} className="about-feature-card">
                <div className="about-feature-card__header">
                  <div className="about-feature-card__icon-badge" aria-hidden="true">
                    <Icon name={item.icon} className="about-feature-card__icon" />
                  </div>
                  <div className="about-feature-card__meta">
                    <span className="about-feature-card__tag">{item.tag}</span>
                    <h3 className="about-feature-card__title">{item.title}</h3>
                  </div>
                </div>
                <p className="about-feature-card__desc">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Column 2: برامج المركز وإصداراته */}
        <section className="about-col about-col--programs" aria-labelledby="about-programs-heading">
          <div className="about-col__head">
            <div className="about-col__icon-wrap about-col__icon-wrap--accent" aria-hidden="true">
              <Icon name="layers" className="about-col__icon" />
            </div>
            <div className="about-col__head-info">
              <span className="about-col__badge about-col__badge--accent">
                {isAr ? 'المنصات والأوعية الثقافية' : 'Platforms & Publications'}
              </span>
              <h2 id="about-programs-heading" className="about-col__title">
                {isAr ? 'برامج المركز وإصداراته' : 'Programs and Publications'}
              </h2>
            </div>
          </div>
          <p className="about-col__lead">
            {isAr
              ? 'المشاريع والمنافذ الدورية التي يُنتج المركز من خلالها المعرفة ويتيحها للباحثين والجمهور:'
              : 'Periodical projects and venues through which the Center disseminates scholarship:'}
          </p>

          <div className="about-card-list">
            {programs.map((item, idx) => (
              <article key={idx} className="about-feature-card about-feature-card--interactive">
                <div className="about-feature-card__header">
                  <div className="about-feature-card__icon-badge about-feature-card__icon-badge--accent" aria-hidden="true">
                    <Icon name={item.icon} className="about-feature-card__icon" />
                  </div>
                  <div className="about-feature-card__meta">
                    <span className="about-feature-card__tag about-feature-card__tag--accent">{item.tag}</span>
                    <h3 className="about-feature-card__title">{item.title}</h3>
                  </div>
                </div>
                <p className="about-feature-card__desc">{item.description}</p>
                <div className="about-feature-card__footer">
                  <Link href={item.href} className="about-card-action">
                    <span>{item.actionText}</span>
                    <Icon name="arrow" className="about-card-action__arrow" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Component 4 — Location & Contact Banner */}
      <section className="about-location-banner" aria-label={isAr ? 'الموقع والتواصل' : 'Location and Contact'}>
        <div className="about-location-banner__content">
          <div className="about-location-banner__icon-box" aria-hidden="true">
            <Icon name="pin" className="about-location-banner__icon" />
          </div>
          <div className="about-location-banner__info">
            <h3 className="about-location-banner__title">
              {isAr ? 'المقر الرئيس للمركز' : 'Center Headquarters'}
            </h3>
            <p className="about-location-banner__text">
              {isAr
                ? 'المقر الرئيس في مدينة المكلا، حضرموت، الجمهورية اليمنية. للعنوان وتفاصيل الاتصال والاستفسارات العلمية:'
                : 'Headquarters in Al-Mukalla, Hadhramout, Republic of Yemen. For address, scientific inquiries, and contact:'}
            </p>
          </div>
        </div>
        <div className="about-location-banner__action">
          <Link href={href('/contact')} className="btn btn--primary about-location-banner__btn">
            <span>{isAr ? 'صفحة التواصل والاستفسارات' : 'Contact & Inquiries Page'}</span>
            <Icon name="arrow" className="about-location-banner__btn-arrow" />
          </Link>
        </div>
      </section>
    </div>
  );
}
