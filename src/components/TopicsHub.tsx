import Image from 'next/image';
import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import type { TopicNode } from '../lib/facet-core.ts';
import { normalizeArabic } from '../lib/arabic.ts';
import { Icon, type IconName } from './Icon.tsx';

function safeMediaUrl(src: string): string {
  if (!src.startsWith('/')) return src;
  return src
    .split('/')
    .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
    .join('/');
}

interface HubMeta {
  image: string;
  icon: IconName;
  color: string;
  descAr: string;
  descEn: string;
}

const TOPIC_HUB_METAS: { match: string; meta: HubMeta }[] = [
  {
    match: 'دراسات وبحوث',
    meta: {
      image: '/legacy-media/2025/12/غلاف-المؤتمر-الخامس-التاريخ-والمؤرخون-الحضارمة3-scaled.jpg',
      icon: 'manuscript',
      color: '#173d30',
      descAr: 'بحوث محكّمة وأوراق أكاديمية وملفات توثيقية متخصصة',
      descEn: 'Peer-reviewed research and scholarly documented studies',
    },
  },
  {
    match: 'التاريخ والتراث والآثار',
    meta: {
      image: '/legacy-media/2025/12/غلاف-كتاب-العقلة-3-scaled.jpg',
      icon: 'bookmark',
      color: '#C99A52',
      descAr: 'العمارة الطينية، الشواهد الأثرية، ومحطات التاريخ الحضرمي',
      descEn: 'Archaeology, mudbrick architecture, and historical heritage',
    },
  },
  {
    match: 'الأعلام والشخصيات',
    meta: {
      image: '/legacy-media/2025/12/غلاف-محاضرات-انجرامز3-scaled.jpg',
      icon: 'users',
      color: '#173d30',
      descAr: 'سِيَر الأعلام والرواد ومؤرخي حضرموت واليمن عبر العصور',
      descEn: 'Biographies of prominent historical figures and scholars',
    },
  },
  {
    match: 'الأدب والإبداع',
    meta: {
      image: '/legacy-media/2025/06/مجلة-حضرموت-الثقافية-العدد-36_Page1.png',
      icon: 'rosette',
      color: '#D9534F',
      descAr: 'قصائد شعرية، نصوص قصصية وإبداعات كتابية معاصرة',
      descEn: 'Poetry, short stories, and contemporary creative writings',
    },
  },
  {
    match: 'الفنون والمسرح',
    meta: {
      image: '/legacy-media/2025/12/مجلة-38.jpg',
      icon: 'play',
      color: '#8E44AD',
      descAr: 'ذاكرة المسرح الحضرمي، الفنون التشكيلية والتجارب البصرية',
      descEn: 'Hadhrami theatre history, fine arts, and visual culture',
    },
  },
  {
    match: 'حوارات ولقاءات واستطلاعات',
    meta: {
      image: '/legacy-media/2025/09/العلاقات-السياسية-مركز-حضرموت3-scaled.jpg',
      icon: 'quote',
      color: '#173d30',
      descAr: 'لقاءات فكرية، استطلاعات ميدانية وحوارات مع الباحثين',
      descEn: 'Intellectual dialogues, cultural field surveys, and interviews',
    },
  },
  {
    match: 'قراءات ونقد',
    meta: {
      image: '/legacy-media/2025/12/ألفاظ-رمضانية-وعيدية-حضرمية-فصيحة3-scaled.jpg',
      icon: 'book',
      color: '#27AE60',
      descAr: 'مراجعات الكتب والإصدارات وقراءات نقدية في الفكر والأدب',
      descEn: 'Book reviews, analytical critique, and literary discussions',
    },
  },
  {
    match: 'مقالات ورؤى',
    meta: {
      image: '/legacy-media/2026/03/Issue-39-flat.jpg',
      icon: 'file',
      color: '#173d30',
      descAr: 'مقالات فكرية، إضاءات مجتمعية ودراسات مترجمة',
      descEn: 'Intellectual essays, cultural spotlights, and translations',
    },
  },
];

const DEFAULT_HUB_META: HubMeta = {
  image: '/legacy-media/2024/03/غلاف-المجلة-موك-اب-1.jpg',
  icon: 'layers',
  color: '#173d30',
  descAr: 'استكشف المقالات والدراسات المنشورة في هذا الباب',
  descEn: 'Explore published articles and studies in this section',
};

function getHubMeta(name: string, lang: string): { image: string; icon: IconName; color: string; desc: string } {
  const n = normalizeArabic(name);
  const found = TOPIC_HUB_METAS.find((item) => n.includes(normalizeArabic(item.match)) || normalizeArabic(item.match).includes(n));
  const meta = found ? found.meta : DEFAULT_HUB_META;
  return {
    image: meta.image,
    icon: meta.icon,
    color: meta.color,
    desc: lang === 'ar' ? meta.descAr : meta.descEn,
  };
}

export function TopicHubCard({
  ctx,
  topic,
  priority = false,
}: {
  ctx: Ctx;
  topic: TopicNode;
  priority?: boolean;
}) {
  const { href, t, lang } = ctx;
  const meta = getHubMeta(topic.name, lang.code);
  const safeSrc = safeMediaUrl(meta.image);
  const countLabel = t('topics.count', { count: topic.total });

  return (
    <article className="topic-hub-card">
      <div className="topic-hub-card__media">
        <Image
          src={safeSrc}
          alt={topic.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 320px"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="topic-hub-card__img"
        />
        <div className="topic-hub-card__media-gradient" />
        <div className="topic-hub-card__badges">
          <span className="topic-hub-card__icon-badge" style={{ color: meta.color }} aria-hidden="true">
            <Icon name={meta.icon} />
          </span>
          <span className="topic-hub-card__count-badge">{countLabel}</span>
        </div>
      </div>

      <div className="topic-hub-card__content">
        <div className="topic-hub-card__header">
          <h2 className="topic-hub-card__title">
            <Link href={href(`/topics/${topic.id}`)}>{topic.name}</Link>
          </h2>
          {meta.desc ? <p className="topic-hub-card__desc">{meta.desc}</p> : null}
        </div>

        {topic.children.length > 0 ? (
          <div className="topic-hub-card__sub-section">
            <span className="topic-hub-card__sub-label">{t('topics.sub')}</span>
            <ul className="topic-hub-card__sub-list" aria-label={t('topics.sub')}>
              {topic.children
                .filter((c) => c.own > 0)
                .map((c) => (
                  <li key={c.id} className="topic-hub-card__sub-item">
                    <Link href={href(`/topics/${c.id}`)} className="topic-hub-card__sub-link">
                      <span className="topic-hub-card__sub-bullet" aria-hidden="true" />
                      <span className="topic-hub-card__sub-name">{c.name}</span>
                      <span className="topic-hub-card__sub-count">({c.own})</span>
                      <Icon name="arrow" className="topic-hub-card__sub-arrow" />
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        <div className="topic-hub-card__footer">
          <Link href={href(`/topics/${topic.id}`)} className="topic-hub-card__view-all-link">
            <span>{lang.code === 'ar' ? 'عرض جميع الموضوعات' : 'View all topics'}</span>
            <Icon name="arrow" className="topic-hub-card__footer-arrow" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function TopicsHub({
  ctx,
  roots,
  others,
  uncategorised,
}: {
  ctx: Ctx;
  roots: TopicNode[];
  others: TopicNode[];
  uncategorised: number;
}) {
  const { t, href } = ctx;
  const totalArticles =
    roots.reduce((s, r) => s + r.total, 0) + others.reduce((s, r) => s + r.total, 0);

  return (
    <div className="topics-hub-wrapper" data-aos="fade-up">
      {/* A. Summary Bar */}
      <div className="topics-page-summary">
        <div className="topics-page-summary__start">
          <div className="topics-page-summary__header-row">
            <span className="topics-page-summary__icon" aria-hidden="true">
              <Icon name="layers" />
            </span>
            <h2 className="topics-page-summary__title">{t('home.topics')}</h2>
            <span className="topics-page-summary__badge">
              <Icon name="manuscript" className="topics-page-summary__badge-icon" />
              <span>{t('topics.count', { count: totalArticles })}</span>
            </span>
          </div>
          <p className="topics-page-summary__desc">
            {t('home.topics.lead')}
          </p>
        </div>
        <div className="topics-page-summary__end">
          <Link href={href('/topics')} className="topics-page-summary__all-link" aria-current="page">
            <span>{t('home.topics.more')}</span>
            <Icon name="arrow" className="topics-page-summary__all-arrow" />
          </Link>
        </div>
      </div>

      {/* B. Grid of 8 Curated Cards */}
      <div className="topics-hub-grid" data-aos="fade-up" data-aos-delay="100">
        {roots.map((r, i) => (
          <TopicHubCard key={r.id} ctx={ctx} topic={r} priority={i < 4} />
        ))}
      </div>

      {/* C. Other Topics */}
      {others.length > 0 ? (
        <section className="topics-hub-others" aria-labelledby="topics-others-title" data-aos="fade-up" data-aos-delay="150">
          <div className="topics-hub-others__header">
            <div className="topics-hub-others__title-group">
              <span className="topics-hub-others__icon" aria-hidden="true">
                <Icon name="tag" />
              </span>
              <h2 id="topics-others-title" className="topics-hub-others__title">
                {t('topics.other')}
              </h2>
            </div>
            <span className="topics-hub-others__count">
              {t('topics.count', { count: others.reduce((s, r) => s + r.total, 0) })}
            </span>
          </div>
          <ul className="topics-hub-others__list" aria-label={t('topics.other')}>
            {others.map((c) => (
              <li key={c.id}>
                <Link href={href(`/topics/${c.id}`)} className="topics-hub-others__chip">
                  <span>{c.name}</span>
                  <span className="topics-hub-others__chip-count">{c.total}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* D. Uncategorised Notice */}
      {uncategorised > 0 ? (
        <p className="topics-hub-uncategorised">
          <span>{t('topics.uncategorised', { count: uncategorised })}</span>{' '}
          <Link href={href('/articles')}>{t('topics.browseAll')}</Link>
        </p>
      ) : null}
    </div>
  );
}
