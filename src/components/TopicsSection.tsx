import Image from 'next/image';
import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import type { TopicNode } from '../lib/facet-core.ts';
import { Icon, type IconName } from './Icon.tsx';

function safeMediaUrl(src: string): string {
  if (!src.startsWith('/')) return src;
  return src
    .split('/')
    .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
    .join('/');
}

interface TopicMeta {
  image: string;
  icon: IconName;
  subtitleAr: string;
  subtitleEn: string;
}

const TOPIC_META_BY_ID: Record<number, TopicMeta> = {
  21: {
    // دراسات
    image: '/legacy-media/2025/12/غلاف-المؤتمر-الخامس-التاريخ-والمؤرخون-الحضارمة3-scaled.jpg',
    icon: 'manuscript',
    subtitleAr: 'بحوث محكّمة ودراسات تحليلية متخصصة',
    subtitleEn: 'Peer-reviewed research and scholarly studies',
  },
  15: {
    // كتابات / مقالات
    image: '/legacy-media/2025/12/غلاف-مقالات-حسين-البار3-scaled.jpg',
    icon: 'file',
    subtitleAr: 'مقالات فكرية ورؤى ثقافية معاصرة',
    subtitleEn: 'Intellectual essays and cultural perspectives',
  },
  26: {
    // أضواء
    image: '/legacy-media/2026/03/Issue-39-flat.jpg',
    icon: 'sun',
    subtitleAr: 'إضاءات موسعة وقضايا ثقافية بارزة',
    subtitleEn: 'In-depth spotlights and focal coverage',
  },
  38: {
    // نقد
    image: '/legacy-media/2025/12/ألفاظ-رمضانية-وعيدية-حضرمية-فصيحة3-scaled.jpg',
    icon: 'quote',
    subtitleAr: 'قراءات نقدية ومراجعات فكرية وأدبية',
    subtitleEn: 'Literary criticism and analytical reviews',
  },
  31: {
    // شخصيات
    image: '/legacy-media/2025/12/غلاف-محاضرات-انجرامز3-scaled.jpg',
    icon: 'users',
    subtitleAr: 'سِيَر الأعلام ورواد الفكر والتاريخ',
    subtitleEn: 'Biographies of prominent historical figures',
  },
  39: {
    // إبداع
    image: '/legacy-media/2025/06/مجلة-حضرموت-الثقافية-العدد-36_Page1.png',
    icon: 'rosette',
    subtitleAr: 'نصوص شعرية وقصصية وإبداع أدبي',
    subtitleEn: 'Poetry, short stories, and creative writings',
  },
  24: {
    // إبداعات
    image: '/legacy-media/2025/06/مجلة-حضرموت-الثقافية-العدد-36_Page1.png',
    icon: 'rosette',
    subtitleAr: 'نصوص شعرية وقصصية وإبداع أدبي',
    subtitleEn: 'Poetry, short stories, and creative writings',
  },
  35: {
    // ترجمة
    image: '/legacy-media/2025/12/غلاف-كتاب-دور-الحضارمة-في-بناء-الدولة-الإسلامية3-scaled.jpg',
    icon: 'globe',
    subtitleAr: 'ترجمات لنصوص ودراسات عالمية واستشراقية',
    subtitleEn: 'Translations of global historical studies',
  },
  10: {
    // تراث
    image: '/legacy-media/2025/12/غلاف-كتاب-العقلة-3-scaled.jpg',
    icon: 'bookmark',
    subtitleAr: 'شواهد وآثار وتراث حضرموت الأصيل',
    subtitleEn: 'Archaeology, monuments, and living heritage',
  },
  16: {
    // تاريخ
    image: '/legacy-media/2025/12/أبحاث-في-تاريخ-السلطنة-القعيطية3-scaled.jpg',
    icon: 'history',
    subtitleAr: 'محطات ووثائق من تاريخ حضرموت واليمن',
    subtitleEn: 'Documented chapters of Hadhrami history',
  },
  42: {
    // ملف العدد
    image: '/legacy-media/2025/12/مجلة-38.jpg',
    icon: 'layers',
    subtitleAr: 'ملفات توثيقية وقضايا فكرية جامعة',
    subtitleEn: 'Thematic dossiers and dedicated special files',
  },
  23: {
    // حوار
    image: '/legacy-media/2025/09/العلاقات-السياسية-مركز-حضرموت3-scaled.jpg',
    icon: 'users',
    subtitleAr: 'حوارات فكرية ونقاشات مع كبار المفكرين',
    subtitleEn: 'Intellectual dialogues and cultural interviews',
  },
  14: {
    // حديث البداية
    image: '/legacy-media/2024/03/غلاف-المجلة-موك-اب-1.jpg',
    icon: 'manuscript',
    subtitleAr: 'افتتاحيات رئيس التحرير وهيئة المجلة',
    subtitleEn: 'Editorial openings and editorial board notes',
  },
};

const DEFAULT_META: TopicMeta = {
  image: '/legacy-media/2024/03/غلاف-المجلة-موك-اب-1.jpg',
  icon: 'layers',
  subtitleAr: 'استكشف أحدث المقالات والدراسات المنشورة',
  subtitleEn: 'Explore recent published articles and studies',
};

function getTopicMeta(topic: TopicNode, lang: string): { image: string; icon: IconName; subtitle: string } {
  const found = TOPIC_META_BY_ID[topic.id];
  if (found) {
    return {
      image: found.image,
      icon: found.icon,
      subtitle: lang === 'ar' ? found.subtitleAr : found.subtitleEn,
    };
  }
  return {
    image: DEFAULT_META.image,
    icon: DEFAULT_META.icon,
    subtitle: lang === 'ar' ? DEFAULT_META.subtitleAr : DEFAULT_META.subtitleEn,
  };
}

export function TopicCard({
  ctx,
  topic,
  priority = false,
}: {
  ctx: Ctx;
  topic: TopicNode;
  priority?: boolean;
}) {
  const { href, t, lang } = ctx;
  const meta = getTopicMeta(topic, lang.code);
  const safeSrc = safeMediaUrl(meta.image);
  const countStr = topic.total > 0 ? t('topics.count', { count: topic.total }) : null;

  return (
    <article className="topic-card-v2">
      <Link
        href={href(`/topics/${topic.id}`)}
        className="topic-card-v2__link"
        aria-label={`${topic.name}${countStr ? ` (${countStr})` : ''}`}
      >
        <div className="topic-card-v2__media">
          <Image
            src={safeSrc}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1400px) 25vw, 320px"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="topic-card-v2__img"
          />
          <div className="topic-card-v2__media-gradient" />
          <div className="topic-card-v2__badges">
            <span className="topic-card-v2__icon-badge" aria-hidden="true">
              <Icon name={meta.icon} />
            </span>
            {countStr ? (
              <span className="topic-card-v2__count-badge">{countStr}</span>
            ) : null}
          </div>
        </div>

        <div className="topic-card-v2__body">
          <h3 className="topic-card-v2__title">{topic.name}</h3>
          {meta.subtitle ? (
            <p className="topic-card-v2__desc">{meta.subtitle}</p>
          ) : topic.description ? (
            <p className="topic-card-v2__desc">{topic.description}</p>
          ) : null}
          <div className="topic-card-v2__footer">
            <span className="topic-card-v2__browse-label">
              {lang.code === 'ar' ? 'تصفّح الأرشيف' : 'Browse archive'}
            </span>
            <Icon name="arrow" className="topic-card-v2__arrow" />
          </div>
        </div>
      </Link>
    </article>
  );
}

export function TopicsSection({
  ctx,
  topics,
  limit = 12,
}: {
  ctx: Ctx;
  topics: TopicNode[];
  limit?: number;
}) {
  const { t, href } = ctx;
  const list = topics.slice(0, limit);

  if (!list.length) return null;

  return (
    <section className="topics-section" aria-labelledby="topics-section-title">
      <div className="container">
        <div className="editorial-head topics-section__head">
          <div className="topics-section__head-main">
            <div className="editorial-head__title-group">
              <span className="editorial-head__icon" aria-hidden="true">
                <Icon name="layers" />
              </span>
              <h2 id="topics-section-title" className="editorial-head__title">
                {t('home.topics')}
              </h2>
            </div>
            <p className="topics-section__lead">
              {t('home.topics.lead')}
            </p>
          </div>
          <Link href={href('/topics')} className="editorial-head__more">
            <span>{t('home.topics.more')}</span>
            <Icon name="arrow" className="editorial-head__arrow" />
          </Link>
        </div>

        <div className="topics-grid-v2">
          {list.map((topic, i) => (
            <TopicCard key={topic.id} ctx={ctx} topic={topic} priority={i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
