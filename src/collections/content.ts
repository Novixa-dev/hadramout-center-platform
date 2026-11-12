import type { CollectionConfig, Field } from 'payload';
import { baseFields, contentAccess, L, localizedText, localizedUpdate, lockForReviewers, markEdited, titleText } from './shared.ts';
import { contentHooks } from '../hooks/content.ts';
import type { CollectionSlug } from '../lib/content-types.ts';
import { EVENT_KIND_VALUES } from '../lib/list-query.ts';
import type { StoreStatus } from '../lib/platform-requests.ts';
import { currencyOptions } from './Platforms.ts';
import { DEFAULT_LOCALE } from '../i18n/locales.ts';

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
    {
      type: 'collapsible',
      label: L('المتجر الإلكتروني', 'Store'),
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'storeStatus',
          type: 'select',
          defaultValue: 'on_request',
          label: L('حالته في المتجر', 'Store status'),
          options: [
            { label: L('بالطلب (يؤكد المركز التوفر والسعر)', 'On request (the Center confirms availability and price)'), value: 'on_request' },
            { label: L('متوفر', 'Available'), value: 'available' },
            { label: L('نفد', 'Out of stock'), value: 'out_of_stock' },
            { label: L('لا يُعرض في المتجر', 'Not listed in the store'), value: 'hidden' },
          ] satisfies { label: Record<string, string>; value: StoreStatus }[],
        },
        {
          type: 'row',
          fields: [
            { name: 'price', type: 'number', min: 0, label: L('السعر', 'Price'), admin: { width: '50%', description: L('اتركه فارغًا إن لم يُعتمد سعر: يُعرض «السعر عند الطلب».', 'Leave empty when no price is set: «price on request» is shown.') } },
            { name: 'currency', type: 'select', options: currencyOptions, label: L('العملة', 'Currency'), admin: { width: '50%' } },
          ],
        },
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

/** Kinds the Center lists under «الفعاليات» (feedback report 2026-10-27), plus discussion panels from the decade book. */
const EVENT_KINDS = EVENT_KIND_VALUES;
const EVENT_KIND_LABELS: Record<(typeof EVENT_KINDS)[number], Record<string, string>> = {
  conference: L('مؤتمر', 'Conference'),
  seminar: L('ندوة', 'Seminar'),
  panel: L('حلقة نقاش', 'Panel discussion'),
  lecture: L('محاضرة', 'Lecture'),
  virtual: L('لقاء افتراضي', 'Virtual meeting'),
  competition: L('مسابقة', 'Competition'),
  other: L('أخرى', 'Other'),
};

type ParticipantRole = 'speaker' | 'researcher' | 'presenter' | 'chair' | 'moderator' | 'guest';

const eventFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'kind',
        type: 'select',
        index: true,
        label: L('نوع الفعالية', 'Event type'),
        options: EVENT_KINDS.map((value) => ({ value, label: EVENT_KIND_LABELS[value] })),
        admin: { width: '50%', description: L('يحدد القسم الذي تظهر فيه الفعالية في القائمة (مؤتمرات، ندوات، محاضرات…).', 'Decides the menu section the event appears in (conferences, seminars, lectures…).') },
      },
      {
        name: 'attendance',
        type: 'select',
        label: L('طريقة الحضور', 'Attendance'),
        options: [
          { label: L('حضوري', 'In person'), value: 'onsite' },
          { label: L('افتراضي (عن بُعد)', 'Virtual (online)'), value: 'virtual' },
          { label: L('حضوري وافتراضي', 'In person and online'), value: 'hybrid' },
        ],
        admin: { width: '50%' },
      },
    ],
  },
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
  {
    name: 'tracks',
    type: 'array',
    label: L('محاور المؤتمر / الفعالية', 'Conference Tracks / Themes'),
    fields: [
      titleText('title', L('عنوان المحور', 'Track Title'), { required: true }),
      { name: 'description', type: 'textarea', localized: true, label: L('وصف المحور', 'Track Description') },
    ],
  },
  localizedText('chairs', L('رؤساء الجلسات العلمية', 'Session Chairs')),
  {
    name: 'participants',
    type: 'array',
    label: L('المشاركون (الضيوف والمتحدثون ومدراء الجلسات)', 'Participants (guests, speakers, session chairs)'),
    labels: { singular: L('مشارك', 'Participant'), plural: L('المشاركون', 'Participants') },
    admin: { description: L('أضف كل مشارك بدوره؛ يتيح أكثر من ضيف في المنتدى والبودكاست.', 'One row per person with their role; allows several guests for forum events.') },
    fields: [
      {
        type: 'row',
        fields: [
          titleText('name', L('الاسم', 'Name'), { required: true, admin: { width: '60%' } }),
          {
            name: 'role',
            type: 'select',
            required: true,
            defaultValue: 'speaker',
            label: L('الدور', 'Role'),
            options: [
              { value: 'speaker', label: L('متحدث', 'Speaker') },
              { value: 'researcher', label: L('باحث مشارك', 'Researcher') },
              { value: 'presenter', label: L('مقدم عرض / محاضر', 'Presenter / lecturer') },
              { value: 'chair', label: L('رئيس جلسة', 'Session chair') },
              { value: 'moderator', label: L('مدير الجلسة', 'Moderator') },
              { value: 'guest', label: L('ضيف', 'Guest') },
            ] satisfies { value: ParticipantRole; label: Record<string, string> }[],
            admin: { width: '40%' },
          },
        ],
      },
    ],
  },
  {
    name: 'supporters',
    type: 'array',
    label: L('الجهات الداعمة', 'Supporters'),
    labels: { singular: L('جهة داعمة', 'Supporter'), plural: L('الجهات الداعمة', 'Supporters') },
    fields: [titleText('name', L('اسم الجهة', 'Name'), { required: true })],
  },
  {
    name: 'papers',
    type: 'array',
    label: L('الأوراق البحثية وجلسات العمل', 'Research Papers & Sessions'),
    fields: [
      titleText('title', L('عنوان البحث أو الورقة', 'Paper Title'), { required: true }),
      localizedText('researcher', L('الباحث / المحاضر', 'Researcher / Author'), { required: true }),
      { name: 'abstract', type: 'textarea', localized: true, label: L('الملخص العلمي', 'Abstract') },
      { name: 'file', type: 'upload', relationTo: 'media', label: L('ملف البحث (PDF)', 'Paper File (PDF)') },
      { name: 'fileUrl', type: 'text', label: L('أو رابط ملف خارجي', 'Direct File URL') },
    ],
  },
];

export const Events = contentCollection('events', { singular: L('مؤتمر / ندوة', 'Conference / seminar'), plural: L('المؤتمرات والندوات', 'Conferences & seminars') }, eventFields, { columns: ['title', 'eventDate', 'status'] });

export const ForumEvents = contentCollection('forum-events', { singular: L('فعالية منتدى', 'Forum event'), plural: L('منتدى عميد الوفاء', 'Ameed Al-Wafa Forum') }, [...eventFields, categoryField], { columns: ['title', 'eventDate', 'status'] });

export const Videos = contentCollection(
  'videos',
  { singular: L('فيديو', 'Video'), plural: L('المرئيات', 'Videos') },
  [
    { name: 'youtubeId', type: 'text', label: L('معرّف فيديو يوتيوب', 'YouTube video ID'), admin: { description: L('الجزء بعد v= في رابط يوتيوب.', 'The part after v= in the YouTube link.') } },
    { name: 'embedUrl', type: 'text', label: L('رابط تضمين آخر', 'Other embed URL') },
    localizedText('guest', L('الضيف', 'Guest')),
    { name: 'duration', type: 'text', label: L('المدة', 'Duration') },
    {
      name: 'clips',
      type: 'array',
      label: L('مقاطع إضافية', 'More clips'),
      labels: { singular: L('مقطع', 'Clip'), plural: L('مقاطع', 'Clips') },
      admin: { description: L('لسلسلة من عدة أجزاء: معرّف يوتيوب أو رابط لكل مقطع.', 'For a multi-part recording: a YouTube ID or a link per part.') },
      fields: [
        titleText('title', L('عنوان المقطع', 'Clip title')),
        {
          type: 'row',
          fields: [
            { name: 'youtubeId', type: 'text', label: L('معرّف يوتيوب', 'YouTube ID'), admin: { width: '40%' } },
            { name: 'url', type: 'text', label: L('أو رابط', 'Or a link'), admin: { width: '60%' } },
          ],
        },
      ],
    },
  ],
);

/**
 * «الموسوعة الحضرمية»: the Center's encyclopedia is still being prepared (decade book pp. 18–19), so this holds no entries until its
 * editors write them. Entries stay drafts until published; every other part of the archive (search, translation, sitemap) follows.
 */
export const Encyclopedia = contentCollection(
  'encyclopedia',
  { singular: L('مدخل موسوعي', 'Encyclopedia entry'), plural: L('الموسوعة الحضرمية', 'Hadhramout encyclopedia') },
  [
    {
      name: 'entryKind',
      type: 'select',
      index: true,
      label: L('نوع المدخل', 'Entry type'),
      options: [
        { label: L('علم (شخصية)', 'Person'), value: 'person' },
        { label: L('مكان', 'Place'), value: 'place' },
        { label: L('حدث', 'Event'), value: 'event' },
        { label: L('مصطلح أو مفهوم', 'Term or concept'), value: 'term' },
        { label: L('مؤسسة أو جماعة', 'Institution or group'), value: 'group' },
        { label: L('أخرى', 'Other'), value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    authorsField,
    categoryField,
    {
      name: 'sources',
      type: 'textarea',
      localized: true,
      label: L('المصادر', 'Sources'),
      admin: { description: L('مصدر في كل سطر. لا يُنشر مدخل بلا مصدر.', 'One source per line. No entry is published without a source.') },
      access: { update: localizedUpdate },
      // The rule above, enforced: checked in Arabic, the language editors write in; translations follow the Arabic text.
      validate: (value: unknown, { data, req }: { data?: { status?: string }; req?: { locale?: string | null; i18n?: { language?: string } } }) =>
        data?.status !== 'published' || ![undefined, null, DEFAULT_LOCALE].includes(req?.locale) || (typeof value === 'string' && value.trim() !== '')
          ? true
          : req?.i18n?.language === 'en'
            ? 'Add at least one source before publishing this entry.'
            : 'أضف مصدرًا واحدًا على الأقل قبل نشر هذا المدخل.',
    },
  ],
  { columns: ['title', 'entryKind', 'status'] },
);
