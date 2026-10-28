import Image from 'next/image';
import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { Icon } from './Icon.tsx';

interface ShowcaseItem {
  id: string;
  brand: string;
  title: string;
  description: string;
  featuresTitle: string;
  features: string[];
  stat1: { value: string; label: string };
  stat2: { value: string; label: string };
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
}

interface DualCardItem {
  id: string;
  tag: string;
  brand: string;
  title: string;
  description: string;
  featuresTitle: string;
  features: string[];
  meta1: { label: string; value: string };
  meta2: { label: string; value: string };
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
}

export function PlatformShowcase({ ctx }: { ctx: Ctx }) {
  const { lang, href } = ctx;
  const isAr = lang.code === 'ar';

  // Section 1: Preserved 100% Unchanged (Archive System)
  const primaryArchiveItem: ShowcaseItem = {
    id: 'archive-system',
    brand: isAr ? 'Hadramout Archive · الأرشيف الرقمي' : 'Hadramout Archive · Digital System',
    title: isAr
      ? 'نظام الأرشيف الرقمي وتوثيق المخطوطات والوثائق التاريخية'
      : 'Digital Archive & Historical Manuscript Documentation System',
    description: isAr
      ? 'منصة سحابية متخصصة لجمع وحفظ المخطوطات النادرة وسجلات الأسر والعلماء ومعالم حضرموت المصورة، مع إتاحة الفهرسة الدقيقة للباحثين والمؤرخين بمواصفات حفظ رقمية دقيقة.'
      : 'A specialized cloud platform for archiving rare manuscripts, scholar registers, and historical landmarks of Hadramout, offering detailed search and research access.',
    featuresTitle: isAr ? 'الميزات التوثيقية والبحثية الرئيسية:' : 'Key Archival & Research Features:',
    features: isAr
      ? [
          'فهرسة علمية معيارية للوثائق والمخطوطات ومصادر التاريخ الحضرمي واليمني',
          'محرك بحث نصوص متقدم يدعم معالجة الجذور والأسماء التاريخية والتشكيل',
          'عارض وثائق ومخطوطات عالي الدقة يدعم التقريب والقراءة التفاعلية المباشرة',
        ]
      : [
          'Standardized academic cataloging of manuscripts and historical documents',
          'Advanced text search engine with root and Arabic diacritic support',
          'High-resolution manuscript viewer with interactive zoom and reading',
        ],
    stat1: {
      value: isAr ? 'أرشفة رقمية مشفّرة' : 'Encrypted Archiving',
      label: isAr ? 'حفظ الوثائق والمخطوطات' : 'Document preservation',
    },
    stat2: {
      value: isAr ? 'تنقيب وبحث متقدم' : 'Advanced Search',
      label: isAr ? 'للأكاديميين والباحثين' : 'For researchers',
    },
    ctaLabel: isAr ? 'استكشاف الأرشيف والوثائق التاريخية' : 'Explore Digital Archive',
    ctaHref: href('/topics'),
    imageSrc: '/legacy-media/2026/10/image-8.png',
    imageAlt: isAr ? 'الأرشيف والتوثيق التاريخي لمركز حضرموت' : 'Hadramout Center Digital Archive',
  };

  // Section 2 & 3: Redesigned Side-by-Side Dual Cards
  const dualCards: DualCardItem[] = [
    {
      id: 'journal-card',
      tag: isAr ? 'مجلة علمية محكّمة' : 'Peer-Reviewed Journal',
      brand: isAr ? 'Hadramout Journal · المجلة المحكّمة' : 'Hadramout Journal · Peer-Reviewed',
      title: isAr
        ? 'بوابة مجلة حضرموت الثقافية ونظام التحكيم والنشر الأكاديمي'
        : 'Hadramout Cultural Journal & Academic Publishing System',
      description: isAr
        ? 'بيئة نشر إلكترونية محكّمة تضم كافة أعداد مجلة حضرموت الثقافية بأبحاثها ودراساتها المحكمة في التاريخ والتراث والفكر، مع توفير منظومة متكاملة للاستشهاد المرجعي والفهرسة العالمية.'
        : 'A peer-reviewed digital publishing environment hosting all issues of the Hadramout Cultural Journal, with citation export and global academic indexing.',
      featuresTitle: isAr ? 'الميزات التحريرية والأكاديمية:' : 'Editorial & Academic Features:',
      features: isAr
        ? [
            'إتاحة الأعداد كاملة بصيغ رقمية مهيأة للتحميل والقراءة عبر كافة الأجهزة',
            'توليد فوري للاستشهادات الأكاديمية بالمعايير العالمية (APA, MLA, BibTeX, RIS)',
            'تصنيف دقيق للدراسات بحسب الحقب التاريخية والمجالات المعرفية وأسماء الباحثين',
          ]
        : [
            'Complete issues in optimized digital formats for reading and downloading',
            'Instant academic citations in global standards (APA, MLA, BibTeX, RIS)',
            'Precise classification by historical eras, knowledge fields, and authors',
          ],
      meta1: {
        label: isAr ? 'الصفة الأكاديمية' : 'Academic Status',
        value: isAr ? 'أعداد فصلية محكّمة' : 'Quarterly Peer-Reviewed',
      },
      meta2: {
        label: isAr ? 'الفهرسة والاستشهاد' : 'Indexing & Citations',
        value: isAr ? 'Zotero & Mendeley' : 'Zotero & Mendeley',
      },
      ctaLabel: isAr ? 'تصفح أعداد المجلة والإصدارات السابقة' : 'Browse Journal Issues & Studies',
      ctaHref: href('/magazines'),
      imageSrc: '/brand/showcase-journal.png',
      imageAlt: isAr ? 'مجلة حضرموت الثقافية المحكمة' : 'Hadramout Cultural Journal',
    },
    {
      id: 'publications-card',
      tag: isAr ? 'إصدارات وكتب المركز' : 'Center Publications & Books',
      brand: isAr ? 'Hadramout Publications · إصدارات المركز' : 'Hadramout Publications · Book Series',
      title: isAr
        ? 'مكتبة إصدارات المركز والكتب التاريخية والموسوعات التوثيقية'
        : 'Center Publications Library & Historical Documentation Series',
      description: isAr
        ? 'منصة رقمية شاملة لإصدارات مركز حضرموت من أبحاث المؤتمرات العلمية، والكتب التوثيقية، وسلاسل تراجم الأعلام، مع توفير خيارات القراءة الرقمية وطلب النسخ المطبوعة للمؤسسات والباحثين.'
        : 'A comprehensive digital library of Hadramout Center publications, conference proceedings, documentary books, and biographical compendiums.',
      featuresTitle: isAr ? 'الميزات والخدمات البحثية:' : 'Research & Publishing Services:',
      features: isAr
        ? [
            'فهرس موثق لإصدارات المركز مع نبذة علمية وفهرس المحتويات لكل كتاب',
            'توفير نسخ إلكترونية مفتوحة المصدر (PDF) جاهزة للتنزيل المباشر',
            'بوابة مخصصة لطلب النسخ المطبوعة والتواصل مع إدارة التوزيع والنشر بالمركز',
          ]
        : [
            'Documented catalog with academic summaries and table of contents for each book',
            'Open-access digital copies (PDF) ready for direct download',
            'Dedicated portal to request print editions and contact publishing management',
          ],
      meta1: {
        label: isAr ? 'المحتوى والإصدار' : 'Publication Type',
        value: isAr ? 'إصدارات علمية موثقة' : 'Verified Scholarly Works',
      },
      meta2: {
        label: isAr ? 'طبيعة الإتاحة' : 'Access Mode',
        value: isAr ? 'قراءة وتحميل مجاني' : 'Free Reading & Download',
      },
      ctaLabel: isAr ? 'تصفح أحدث الإصدارات والمطبوعات' : 'Explore Books & Publications',
      ctaHref: href('/books'),
      imageSrc: '/brand/showcase-publications.png',
      imageAlt: isAr ? 'إصدارات وكتب مركز حضرموت للدراسات التاريخية' : 'Hadramout Center Publications Library',
    },
  ];

  return (
    <section className="platform-showcase" id="platform-preview" aria-labelledby="platform-preview-title" data-aos="fade-up">
      <div className="container">
        {/* Header Notice Banner */}
        <header className="platform-showcase__head">
          <h2 id="platform-preview-title" className="platform-showcase__title">
            {isAr
              ? 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر'
              : 'Hadramout Center for Historical Studies, Documentation and Publishing'}
          </h2>

          <p className="platform-showcase__sublead">
            {isAr
              ? 'منظومة الأرشيف الرقمي وتوثيق المخطوطات والوثائق التاريخية لحفظ ونشر تراث وتاريخ حضرموت:'
              : 'Digital Archive & Historical Documentation System serving Hadramout heritage and history:'}
          </p>
        </header>

        {/* Section 1: 100% Unchanged Original Card (Requirement A) */}
        <div className="platform-showcase__list">
          <article className="showcase-card">
            <div className="showcase-card__grid">
              {/* Media Column */}
              <div className="showcase-card__media-col">
                <div className="showcase-card__media">
                  <Image
                    src={primaryArchiveItem.imageSrc}
                    alt={primaryArchiveItem.imageAlt}
                    fill
                    sizes="(max-width: 900px) 100vw, 560px"
                    priority
                    className="showcase-card__img"
                  />
                  <div className="showcase-card__media-overlay" />
                  <span className="showcase-card__media-tag">
                    <Icon name="rosette" className="showcase-card__media-tag-icon" />
                    <span>{isAr ? 'منظومة معتمدة قيد المراجعة' : 'Preview Module'}</span>
                  </span>
                </div>
              </div>

              {/* Content Column */}
              <div className="showcase-card__content-col">
                <span className="showcase-card__brand">{primaryArchiveItem.brand}</span>

                <h3 className="showcase-card__title">{primaryArchiveItem.title}</h3>

                <p className="showcase-card__desc">{primaryArchiveItem.description}</p>

                <div className="showcase-card__features-wrap">
                  <p className="showcase-card__features-title">
                    {primaryArchiveItem.featuresTitle}
                  </p>
                  <ul className="showcase-card__features">
                    {primaryArchiveItem.features.map((feat, fIdx) => (
                      <li key={fIdx} className="showcase-card__feature-item">
                        <span className="showcase-card__check" aria-hidden="true">
                          <Icon name="check" className="showcase-card__check-icon" />
                        </span>
                        <span className="showcase-card__feature-text">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats Highlights Box */}
                <div className="showcase-card__highlights">
                  <div className="showcase-card__highlight-item">
                    <strong className="showcase-card__highlight-val">{primaryArchiveItem.stat1.value}</strong>
                    <span className="showcase-card__highlight-label">{primaryArchiveItem.stat1.label}</span>
                  </div>
                  <div className="showcase-card__highlight-divider" aria-hidden="true" />
                  <div className="showcase-card__highlight-item">
                    <strong className="showcase-card__highlight-val">{primaryArchiveItem.stat2.value}</strong>
                    <span className="showcase-card__highlight-label">{primaryArchiveItem.stat2.label}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="showcase-card__cta-wrap">
                  <Link href={primaryArchiveItem.ctaHref} className="showcase-card__cta">
                    <span>{primaryArchiveItem.ctaLabel}</span>
                    <Icon name="arrow" className="showcase-card__cta-arrow" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Section 2 & 3: Redesigned Dual Cards Side-by-Side (Requirement B) */}
        <div className="featured-sections-grid" data-aos="fade-up" data-aos-delay="150">
          {dualCards.map((card) => (
            <article key={card.id} className="featured-card">
              {/* Card Image */}
              <div className="featured-card__media-wrap">
                <div className="featured-card__media">
                  <Image
                    src={card.imageSrc}
                    alt={card.imageAlt}
                    fill
                    sizes="(max-width: 900px) 100vw, 580px"
                    className="featured-card__img"
                  />
                  <div className="featured-card__overlay" />
                  <span className="featured-card__badge">
                    <Icon name="rosette" className="featured-card__badge-icon" />
                    <span>{card.tag}</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="featured-card__body">
                <span className="featured-card__brand">{card.brand}</span>
                <h3 className="featured-card__title">{card.title}</h3>
                <p className="featured-card__desc">{card.description}</p>

                {/* Features Checklist */}
                <div className="featured-card__features-wrap">
                  <h4 className="featured-card__features-title">{card.featuresTitle}</h4>
                  <ul className="featured-card__features-list">
                    {card.features.map((feat, fIdx) => (
                      <li key={fIdx} className="featured-card__feature-item">
                        <span className="featured-card__check" aria-hidden="true">
                          <Icon name="check" className="featured-card__check-icon" />
                        </span>
                        <span className="featured-card__feature-text">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metadata Highlight Panel */}
                <div className="featured-card__metadata">
                  <div className="featured-card__meta-item">
                    <span className="featured-card__meta-label">{card.meta1.label}</span>
                    <strong className="featured-card__meta-val">{card.meta1.value}</strong>
                  </div>
                  <div className="featured-card__meta-divider" aria-hidden="true" />
                  <div className="featured-card__meta-item">
                    <span className="featured-card__meta-label">{card.meta2.label}</span>
                    <strong className="featured-card__meta-val">{card.meta2.value}</strong>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="featured-card__cta-wrap">
                  <Link href={card.ctaHref} className="featured-card__cta">
                    <span>{card.ctaLabel}</span>
                    <Icon name="arrow" className="featured-card__cta-arrow" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Call to Action Banner with Distinguished Scholar Figure */}
        <div className="platform-cta-banner" data-aos="fade-up" data-aos-delay="200">
          <div className="platform-cta-banner__content">
            <h3 className="platform-cta-banner__title">
              {isAr ? (
                <>
                  منصة مركز حضرموت،
                  <br />
                  بوابتكم لتوثيق التاريخ ونشر المعرفة.
                </>
              ) : (
                <>
                  Hadramout Center Platform,
                  <br />
                  Your Gateway to History & Heritage.
                </>
              )}
            </h3>

            <p className="platform-cta-banner__desc">
              {isAr
                ? 'نسخة تجريبية قيد التطوير للمراجعة — نرحب بملاحظات المؤرخين والباحثين، ونسعد باستقبال طلبات التوثيق والأرشفة التاريخية والاستشارات العلمية.'
                : 'A developmental preview for review — welcoming feedback from researchers and historians, as well as documentation and scholarly consultation requests.'}
            </p>
          </div>

          {/* Distinguished Scholar Figure (Popping out from the top of the banner) */}
          <div className="platform-cta-banner__figure">
            <Image
              src="/legacy-media/2026/10/hadrami-scholar-cutout.png"
              alt={isAr ? 'مؤرخ وباحث مركز حضرموت للدراسات التاريخية' : 'Hadramout Center Scholar & Historian'}
              width={340}
              height={440}
              priority
              className="platform-cta-banner__figure-img"
            />
          </div>

          {/* Decorative Cultural Watermark */}
          <div className="platform-cta-banner__watermark" aria-hidden="true">
            <Icon name="rosette" />
          </div>
        </div>
      </div>
    </section>
  );
}
