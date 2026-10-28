import type { CollectionConfig, Field } from 'payload';
import { baseFields, contentAccess, L, localizedText, lockForReviewers, markEdited } from './shared.ts';
import { contentHooks } from '../hooks/content.ts';
import type { CollectionSlug } from '../lib/content-types.ts';

/** Builds one content collection from the shared base fields plus its own. */
function contentCollection(
  slug: CollectionSlug,
  labels: { singular: Record<string, string>; plural: Record<string, string> },
  extra: Field[],
  opts: { body?: boolean; cover?: boolean; date?: boolean; columns?: string[] } = {},
): CollectionConfig {
  const hooks = contentHooks(slug);
  return {
    slug,
    labels,
    admin: {
      useAsTitle: 'title',
      group: L('المحتوى', 'Content'),
      defaultColumns: opts.columns ?? ['title', 'status', 'publishedAt'],
      listSearchableFields: ['title'],
    },
    defaultSort: '-publishedAt',
    access: contentAccess,
    hooks: { ...hooks, beforeChange: [...(markEdited ?? []), ...(hooks.beforeChange ?? [])] },
    fields: lockForReviewers([...baseFields(opts), ...extra]),
  };
}

const authorsField: Field = {
  name: 'authors',
  type: 'relationship',
  relationTo: 'authors',
  hasMany: true,
  label: L('الكتّاب', 'Authors'),
  admin: { position: 'sidebar' },
};

const categoryField: Field = { name: 'category', type: 'relationship', relationTo: 'categories', label: L('التصنيف', 'Category'), admin: { position: 'sidebar' } };

export const News = contentCollection('news', { singular: L('خبر', 'News item'), plural: L('الأخبار', 'News') }, [
  localizedText('dateline', L('سطر المصدر', 'Dateline'), { admin: { position: 'sidebar', description: L('مثال: المكلا / إعلام المركز', 'e.g. Mukalla / Center Media') } }),
]);

export const Articles = contentCollection(
  'articles',
  { singular: L('مقال / دراسة', 'Article / study'), plural: L('المقالات والدراسات', 'Articles & studies') },
  [
    authorsField,
    categoryField,
    { name: 'magazine', type: 'relationship', relationTo: 'magazines', label: L('العدد المنشور فيه', 'Published in issue'), admin: { position: 'sidebar' } },
  ],
  // the cover is an optional lead image (1200 px wide or more): the article header, its share card and JSON-LD use it first
  { columns: ['title', 'authors', 'status'] },
);

export const Books = contentCollection(
  'books',
  { singular: L('كتاب', 'Book'), plural: L('الكتب', 'Books') },
  [
    authorsField,
    categoryField,
    localizedText('publisher', L('الناشر', 'Publisher')),
    localizedText('edition', L('رقم الطبعة', 'Edition')),
    localizedText('editor', L('تحقيق / تقديم', 'Editor / verifier')),
    localizedText('translator', L('ترجمة', 'Translator')),
    {
      type: 'row',
      fields: [
        {
          name: 'year',
          type: 'number',
          label: L('سنة النشر', 'Publication year'),
          min: 1800,
          max: 2100,
          admin: { description: L('تُستخدم في الاستشهاد العلمي. اتركها فارغة إن لم تُعرف.', 'Used in citations. Leave empty when unknown.') },
        },
        { name: 'pages', type: 'number', label: L('عدد الصفحات', 'Pages'), min: 1 },
        { name: 'isbn', type: 'text', label: L('ردمك (ISBN)', 'ISBN') },
      ],
    },
    { name: 'pdf', type: 'text', label: L('رابط ملف PDF', 'PDF link'), admin: { description: L('رابط تنزيل الكتاب إن كان متاحاً للعموم.', 'Download link when the book is publicly available.') } },
  ],
  { columns: ['title', 'year', 'status'] },
);

export const Magazines = contentCollection(
  'magazines',
  { singular: L('عدد مجلة', 'Magazine issue'), plural: L('أعداد المجلة', 'Magazine issues') },
  [
    { name: 'issueNumber', type: 'number', required: true, unique: true, index: true, label: L('رقم العدد', 'Issue number'), admin: { position: 'sidebar' } },
    localizedText('season', L('الموسم', 'Season'), { admin: { position: 'sidebar', description: L('مثال: خريف 2025', 'e.g. Autumn 2025') } }),
    { name: 'pdf', type: 'text', label: L('رابط ملف PDF', 'PDF link') },
  ],
  { columns: ['title', 'issueNumber', 'status'] },
);

const eventFields: Field[] = [
  localizedText('speaker', L('المتحدث', 'Speaker')),
  localizedText('moderator', L('مدير الجلسة', 'Moderator')),
  localizedText('venue', L('المكان', 'Venue')),
  localizedText('timeText', L('الوقت', 'Time')),
  {
    type: 'row',
    fields: [
      { name: 'eventDate', type: 'date', label: L('تاريخ الفعالية', 'Event date'), admin: { date: { pickerAppearance: 'dayOnly' } } },
      { name: 'endDate', type: 'date', label: L('تاريخ الانتهاء', 'End date'), admin: { date: { pickerAppearance: 'dayOnly' } } },
    ],
  },
  { name: 'youtubeId', type: 'text', label: L('معرّف فيديو يوتيوب', 'YouTube video ID') },
  { name: 'link', type: 'text', label: L('رابط الحضور', 'Join link') },
];

export const Events = contentCollection('events', { singular: L('مؤتمر / ندوة', 'Conference / seminar'), plural: L('المؤتمرات والندوات', 'Conferences & seminars') }, eventFields, { columns: ['title', 'eventDate', 'status'] });

export const ForumEvents = contentCollection('forum-events', { singular: L('فعالية منتدى', 'Forum event'), plural: L('منتدى عميد الوفاء', 'Ameed Al-Wafa Forum') }, eventFields, { columns: ['title', 'eventDate', 'status'] });

export const Videos = contentCollection(
  'videos',
  { singular: L('فيديو', 'Video'), plural: L('المرئيات', 'Videos') },
  [
    { name: 'youtubeId', type: 'text', label: L('معرّف فيديو يوتيوب', 'YouTube video ID'), admin: { description: L('الجزء بعد v= في رابط يوتيوب.', 'The part after v= in the YouTube link.') } },
    { name: 'embedUrl', type: 'text', label: L('رابط تضمين آخر', 'Other embed URL') },
    localizedText('guest', L('الضيف', 'Guest')),
    { name: 'duration', type: 'text', label: L('المدة', 'Duration') },
  ],
);
