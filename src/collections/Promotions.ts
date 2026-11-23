import type { Access, CollectionConfig, Where } from 'payload';
import { contentAccess, L, localizedText, lockForReviewers, titleText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';
import { queueTranslations } from '../hooks/content.ts';
import { PROMO_PAGES, validPromoLink } from '../lib/promotions.ts';
import { deletePromoStats } from '../lib/promo-stats.ts';
import { extras } from '../lib/extras.ts';

const PAGE_LABELS: Record<(typeof PROMO_PAGES)[number], [string, string]> = {
  home: ['الصفحة الرئيسية', 'Home page'],
  articles: ['المقالات والدراسات', 'Articles'],
  books: ['الكتب', 'Books'],
  magazines: ['المجلة', 'Magazine'],
  events: ['المؤتمرات والندوات', 'Events'],
  forum: ['منتدى عميد الوفاء', 'Forum'],
  news: ['الأخبار', 'News'],
  videos: ['المرئيات', 'Videos'],
  audio: ['المكتبة السمعية', 'Audio library'],
  podcast: ['البودكاست', 'Podcast'],
  announcements: ['الإعلانات الرسمية', 'Announcements'],
  encyclopedia: ['الموسوعة', 'Encyclopedia'],
  culture: ['المنصة الثقافية', 'Cultural hub'],
  store: ['المتجر', 'Store'],
  donate: ['التبرعات', 'Donations'],
  volunteer: ['التطوع', 'Volunteering'],
  submit: ['المساهمة البحثية', 'Submissions'],
  about: ['عن المركز', 'About'],
  support: ['دعم المركز', 'Support'],
  partners: ['شركاء النجاح', 'Partners'],
  search: ['البحث', 'Search'],
  authors: ['الكتّاب', 'Authors'],
  topics: ['الموضوعات', 'Topics'],
  timeline: ['الخط الزمني', 'Timeline'],
  contact: ['تواصل معنا', 'Contact'],
};

/** Visitors (public REST) see only published promotions that have started: a scheduled launch stays private until then. */
const readStarted: Access = ({ req }) => {
  if (req.user) return true;
  const started: Where = { and: [{ status: { equals: 'published' } }, { startAt: { less_than_equal: new Date().toISOString() } }] };
  return started;
};

/**
 * Promotions ("ads"): the Center's own campaigns, each shown in one format for a set window of time, on chosen pages and
 * devices, with close and frequency rules and anonymous view/click/close counts. Not official notices (those are
 * `announcements`). Rendering: src/components/client/Promotions.tsx; logic: src/lib/promotions.ts.
 */
export const Promotions: CollectionConfig = {
  slug: 'promotions',
  labels: { singular: L('إعلان ترويجي', 'Promotion'), plural: L('الإعلانات الترويجية', 'Promotions (ads)') },
  admin: {
    useAsTitle: 'headline',
    defaultColumns: ['headline', 'format', 'scheduleState', 'startAt', 'endAt', 'status'],
    group: L('الهيكل والموقع', 'Site Structure'),
    description: L(
      'حملات المركز على الموقع: فعالية، إصدار جديد، دعوة للمشاركة، حملة تبرع، عرض في المتجر… لكل إعلان شكل وموعد بداية ونهاية بالدقيقة وصفحات وأجهزة يظهر فيها. الإحصاءات مجهولة الهوية: لا تُحفظ بيانات الزوار.',
      'The Center\'s campaigns on the site: an event, a new release, a call for papers, a donation drive, a store offer… Each has a format, a start and end to the minute, and the pages and devices it shows on. Counts are anonymous: nothing about visitors is stored.',
    ),
  },
  defaultSort: '-startAt',
  access: { ...contentAccess, read: readStarted },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (req.locale === 'ar' && doc.status === 'published' && req.context?.fromTranslation !== true) {
          try {
            await queueTranslations(req.payload, 'promotions', doc.id, doc, req);
          } catch (err) {
            req.payload.logger.error({ err, msg: `translation queue failed for promotions/${doc.id}` });
          }
        }
        revalidateSite();
        return doc;
      },
    ],
    afterDelete: [
      ({ doc, id }) => {
        // SQLite hands a deleted row's id to the next new row: its counts must not pass to an unrelated promotion
        try {
          deletePromoStats(extras(), Number(id));
        } catch {
          /* the extras database is optional for this */
        }
        revalidateSite();
        return doc;
      },
    ],
  },
  fields: lockForReviewers([
    titleText('headline', L('العنوان الظاهر', 'Headline'), {
      required: true,
      maxLength: 90,
      admin: { description: L('جملة قصيرة واضحة (حتى 90 حرفاً). تُترجم تلقائياً إلى اللغات الأخرى.', 'One short, clear line (up to 90 characters). Translated automatically.') },
    }),
    {
      name: 'text',
      type: 'textarea',
      localized: true,
      maxLength: 240,
      label: L('نص مختصر', 'Short text'),
      admin: { description: L('سطر أو سطران (حتى 240 حرفاً). لا يظهر في الشريط العلوي.', 'One or two lines (up to 240 characters). Not shown in the top bar.') },
    },
    {
      type: 'row',
      fields: [
        localizedText('ctaLabel', L('نص الزر', 'Button text'), { maxLength: 30, admin: { width: '40%', description: L('مثل: سجّل الآن، اطلب الكتاب، تبرّع. يُترك فارغاً لـ«التفاصيل».', 'e.g. Register now, Order the book. Empty = «Details».') } }),
        {
          name: 'ctaUrl',
          type: 'text',
          label: L('رابط الزر', 'Button link'),
          validate: validPromoLink,
          admin: { width: '60%', description: L('مسار داخل الموقع مثل ⁨/donate⁩ أو ⁨/events/12⁩ (تُضاف اللغة تلقائياً)، أو رابط يبدأ بـ ⁨https://⁩', 'A site path such as /donate or /events/12 (the language is added), or an https:// URL') },
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: L('صورة', 'Image'),
      admin: { description: L('اختيارية؛ تظهر في البطاقة والنافذة المنبثقة. يُفضَّل 1200×630 مع نص بديل في المكتبة. تُقصّ أطراف الصورة على الشاشات المختلفة، فلا تضعوا فيها نصاً مهماً.', 'Optional; shown on the card and popup. Prefer 1200×630 with alt text in the library. Edges are cropped on different screens: keep important text out of the image.') },
    },
    {
      name: 'targeting',
      type: 'group',
      label: L('أين ولمن يظهر', 'Where and to whom'),
      fields: [
        {
          name: 'pages',
          type: 'select',
          hasMany: true,
          label: L('الصفحات', 'Pages'),
          options: PROMO_PAGES.map((value) => ({ value, label: L(PAGE_LABELS[value][0], PAGE_LABELS[value][1]) })),
          admin: { description: L('اتركها فارغة ليظهر في كل الصفحات. القسم يشمل صفحاته الفرعية (الكتب = قائمة الكتب وكل كتاب). البطاقة لا تظهر إلا في الرئيسية وصفحات القراءة (مقالة، كتاب، عدد، فعالية…)، فاختيار «المتجر» مثلاً لا يُظهرها.', 'Leave empty for every page. A section includes its own pages (Books = the list and every book). A card shows only on the home page and on reading pages (an article, book, issue, event…), so choosing «Store», for example, does not show it.') },
        },
        {
          name: 'device',
          type: 'select',
          defaultValue: 'all',
          required: true,
          label: L('الأجهزة', 'Devices'),
          options: [
            { value: 'all', label: L('كل الأجهزة', 'All devices') },
            { value: 'mobile', label: L('الجوال فقط', 'Phones only') },
            { value: 'desktop', label: L('الحاسوب واللوحي فقط', 'Desktop and tablet only') },
          ],
        },
      ],
    },
    {
      name: 'behaviour',
      type: 'group',
      label: L('السلوك', 'Behaviour'),
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'dismissible',
              type: 'checkbox',
              defaultValue: true,
              label: L('يمكن للزائر إغلاقه', 'Visitors can close it'),
              admin: { width: '50%', description: L('النافذة المنبثقة والإشعار الجانبي يُغلقان دائماً.', 'A popup and a corner notice can always be closed.') },
            },
            {
              name: 'hideDays',
              type: 'number',
              defaultValue: 7,
              min: 0,
              max: 365,
              required: true,
              label: L('أيام الإخفاء بعد الإغلاق', 'Days hidden after closing'),
              admin: { width: '50%', description: L('0 = حتى يغلق الزائر التبويب.', '0 = until the visitor closes the tab.') },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'frequency',
              type: 'select',
              defaultValue: 'once',
              required: true,
              label: L('تكرار الظهور (للمنبثقة والجانبي)', 'How often (popup and corner)'),
              options: [
                { value: 'once', label: L('مرة واحدة لكل زائر', 'Once per visitor') },
                { value: 'session', label: L('مرة في كل زيارة', 'Once per visit') },
                { value: 'always', label: L('في كل صفحة حتى يُغلق', 'Every page until closed') },
              ],
              admin: { width: '40%' },
            },
            {
              name: 'trigger',
              type: 'select',
              defaultValue: 'delay',
              required: true,
              label: L('متى يظهر', 'When it appears'),
              options: [
                { value: 'delay', label: L('بعد مهلة', 'After a delay') },
                { value: 'scroll', label: L('بعد تمرير 40٪ من الصفحة', 'After 40% of the page is scrolled') },
              ],
              admin: { width: '30%' },
            },
            {
              name: 'delay',
              type: 'number',
              defaultValue: 8,
              min: 3,
              max: 120,
              required: true,
              label: L('المهلة بالثواني', 'Delay (seconds)'),
              admin: { width: '30%', description: L('3 ثوانٍ على الأقل: لا شيء يغطي الصفحة لحظة الدخول.', 'At least 3 s: nothing covers the page on arrival.') },
            },
          ],
        },
      ],
    },
    {
      name: 'stats',
      type: 'ui',
      label: L('الإحصاءات', 'Statistics'),
      admin: { components: { Field: '/admin/fields/PromoStats#PromoStats' } },
    },
    // sidebar: what, how, when
    {
      name: 'format',
      type: 'select',
      required: true,
      defaultValue: 'card',
      label: L('شكل الإعلان', 'Format'),
      options: [
        { value: 'bar', label: L('شريط أعلى الصفحة', 'Top bar') },
        { value: 'card', label: L('بطاقة داخل الصفحة', 'In-page card') },
        { value: 'popup', label: L('نافذة منبثقة', 'Popup') },
        { value: 'corner', label: L('إشعار جانبي صغير', 'Corner notice') },
      ],
      admin: {
        position: 'sidebar',
        description: L(
          'الشريط: سطر أعلى كل صفحة (يُخفى إن ثُبّت إعلان رسمي). البطاقة: في الرئيسية بعد شريط الأرقام والإعلانات الرسمية، وبعد المقالة في صفحات القراءة. المنبثقة: نافذة بعد مهلة، وفي الجوال لوح سفلي. الجانبي: بطاقة صغيرة في زاوية الشاشة.',
          'Bar: one line above every page (hidden while an official announcement is pinned). Card: on the home page after the numbers strip and official announcements, and after the text on reading pages. Popup: a window after a delay, a bottom sheet on phones. Corner: a small card in a corner of the screen.',
        ),
      },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'event',
      label: L('الغرض', 'Purpose'),
      options: [
        { value: 'event', label: L('فعالية', 'Event') },
        { value: 'release', label: L('إصدار جديد', 'New release') },
        { value: 'call', label: L('دعوة للمشاركة', 'Call for participation') },
        { value: 'donation', label: L('حملة تبرع', 'Donation campaign') },
        { value: 'project', label: L('مشروع للدعم', 'Project to support') },
        { value: 'store', label: L('عرض في المتجر', 'Store offer') },
        { value: 'volunteer', label: L('دعوة للتطوع', 'Volunteer call') },
        { value: 'partner', label: L('برعاية شريك', 'Partner-sponsored') },
        { value: 'notice', label: L('تنبيه', 'Notice') },
      ],
      admin: { position: 'sidebar', description: L('يظهر وسماً صغيراً فوق العنوان.', 'Shown as a small label above the headline.') },
    },
    {
      name: 'tone',
      type: 'select',
      required: true,
      defaultValue: 'brand',
      label: L('اللون', 'Colour'),
      options: [
        { value: 'brand', label: L('أخضر المركز', "The Center's green") },
        { value: 'gold', label: L('ذهبي', 'Gold') },
        { value: 'paper', label: L('هادئ (لون الورق)', 'Quiet (paper)') },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'startAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: L('يبدأ الظهور', 'Starts'),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', timeIntervals: 15 }, description: L('بتوقيت جهازك. يظهر في الدقيقة نفسها حتى في الصفحات المخزّنة.', 'In your device\'s time. Honoured to the minute, even on cached pages.') },
    },
    {
      name: 'endAt',
      type: 'date',
      label: L('ينتهي الظهور', 'Ends'),
      validate: (value: unknown, { siblingData }: { siblingData: { startAt?: unknown } }) => {
        if (!value || !siblingData.startAt) return true;
        return Date.parse(String(value)) > Date.parse(String(siblingData.startAt)) || 'يجب أن ينتهي بعد أن يبدأ / must end after it starts';
      },
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', timeIntervals: 15 }, description: L('فارغ = حتى يُوقف يدوياً.', 'Empty = until switched off by hand.') },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 100,
      required: true,
      label: L('الأولوية', 'Priority'),
      admin: { position: 'sidebar', description: L('إن تزامن إعلانان من الشكل نفسه يظهر الأعلى أولوية (ثم الأحدث). إعلان واحد من كل شكل في الصفحة.', 'When two of the same format overlap, the higher priority shows (then the newest). One per format per page.') },
    },
    {
      name: 'scheduleState',
      type: 'ui',
      label: L('حالة الجدولة', 'Schedule'),
      admin: { components: { Cell: '/admin/fields/PromoStateCell#PromoStateCell', Field: '/admin/fields/PromoStateCell#PromoStateField' }, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      options: [
        { label: L('مسودة', 'Draft'), value: 'draft' },
        { label: L('منشور', 'Published'), value: 'published' },
      ],
      label: L('الحالة', 'Status'),
      admin: { position: 'sidebar', description: L('«منشور» مع موعد بداية لاحق = مجدول.', '«Published» with a later start = scheduled.') },
    },
    { name: 'translationMeta', type: 'json', admin: { hidden: true } },
  ]),
};
