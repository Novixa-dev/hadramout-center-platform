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

export function PlatformShowcase({ ctx }: { ctx: Ctx }) {
  const { lang, href } = ctx;
  const isAr = lang.code === 'ar';

  const items: ShowcaseItem[] = [
    {
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
    },
  ];

  return (
    <section className="platform-showcase" id="platform-preview" aria-labelledby="platform-preview-title">
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

        {/* 3 Showcase Components */}
        <div className="platform-showcase__list">
          {items.map((item, index) => {
            const isReversed = index % 2 === 1;

            return (
              <article
                key={item.id}
                className={`showcase-card ${isReversed ? 'showcase-card--reversed' : ''}`}
              >
                <div className="showcase-card__grid">
                  {/* Media Column */}
                  <div className="showcase-card__media-col">
                    <div className="showcase-card__media">
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt}
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
                    <span className="showcase-card__brand">{item.brand}</span>

                    <h3 className="showcase-card__title">{item.title}</h3>

                    <p className="showcase-card__desc">{item.description}</p>

                    <div className="showcase-card__features-wrap">
                      <p className="showcase-card__features-title">
                        {item.featuresTitle}
                      </p>
                      <ul className="showcase-card__features">
                        {item.features.map((feat, fIdx) => (
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
                        <strong className="showcase-card__highlight-val">{item.stat1.value}</strong>
                        <span className="showcase-card__highlight-label">{item.stat1.label}</span>
                      </div>
                      <div className="showcase-card__highlight-divider" aria-hidden="true" />
                      <div className="showcase-card__highlight-item">
                        <strong className="showcase-card__highlight-val">{item.stat2.value}</strong>
                        <span className="showcase-card__highlight-label">{item.stat2.label}</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="showcase-card__cta-wrap">
                      <Link href={item.ctaHref} className="showcase-card__cta">
                        <span>{item.ctaLabel}</span>
                        <Icon name="arrow" className="showcase-card__cta-arrow" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Call to Action Banner with Distinguished Scholar Figure */}
        <div className="platform-cta-banner">
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
