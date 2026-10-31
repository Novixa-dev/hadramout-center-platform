import type { CollectionConfig } from 'payload';
import { cleanBody, contentAccess, L, lockForReviewers, localizedText, titleText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';
import { PAGE_BLOCKS } from './page-blocks.ts';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: L('صفحة', 'Page'), plural: L('الصفحات', 'Pages') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status'],
    group: L('المحتوى', 'Content'),
    livePreview: {
      url: ({ data, locale }) => {
        const lang = locale ? locale.code : 'ar';
        return `/${lang}/${data.slug || ''}?preview=1`;
      },
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  access: contentAccess,
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateSite();
        return doc;
      },
    ],
  },
  fields: lockForReviewers([
    titleText('title', L('العنوان', 'Title'), { required: true }),
    {
      type: 'tabs',
      tabs: [
        {
          label: L('المحتوى والكتل البنائية', 'Content & Blocks'),
          fields: [
            {
              name: 'blocks',
              type: 'blocks',
              blocks: PAGE_BLOCKS,
              label: L('الكتل البنائية', 'Page Blocks'),
              labels: { singular: L('كتلة', 'Block'), plural: L('الكتل', 'Blocks') },
            },
            {
              name: 'body',
              type: 'textarea',
              localized: true,
              hooks: { beforeValidate: [cleanBody] },
              label: L('النص الأساسي (توافق وتنسيق بسيط)', 'Body Text (Fallback & Legacy)'),
              admin: {
                components: { Field: '/admin/fields/HtmlField#HtmlField' },
                description: L(
                  'يُستخدم للصفحات النصية البسيطة أو كخيار احتياطي عند عدم استخدام الكتل البنائية أعلاه.',
                  'Used for simple text pages or as fallback when no blocks are added above.',
                ),
              },
            },
          ],
        },
        {
          label: L('محركات البحث والتواصل', 'SEO & Social'),
          fields: [
            localizedText('metaTitle', L('عنوان محركات البحث', 'SEO Title'), {
              admin: { description: L('عنوان مخصص يظهر في نتائج البحث وشريط المتصفح (50-60 حرفاً).', 'Custom title shown in search results and browser tab (50-60 chars).') },
            }),
            {
              name: 'metaDescription',
              type: 'textarea',
              localized: true,
              label: L('الوصف التعريفي', 'Meta Description'),
              admin: { description: L('ملخص موجز يظهر في نتائج محركات البحث (120-155 حرفاً).', 'Brief summary shown under search engine results (120-155 chars).') },
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              label: L('صورة المشاركة الاجتماعية', 'Social Share Image'),
              admin: { description: L('صورة بنسبة 1200×630 تظهر عند مشاركة الرابط على منصات التواصل.', 'Image (1200x630) shown when sharing the link on social media.') },
            },
            {
              name: 'noindex',
              type: 'checkbox',
              defaultValue: false,
              label: L('حجب من الفهرسة (noindex)', 'Block from indexing (noindex)'),
              admin: { description: L('تفعيل هذا الخيار يطلب من محركات البحث عدم فهرسة هذه الصفحة.', 'Enable this to tell search engine crawlers not to index this page.') },
            },
            {
              name: 'canonicalUrl',
              type: 'text',
              label: L('الرابط القياسي (Canonical URL)', 'Canonical URL'),
              admin: { description: L('اختياري: لتحديد الرابط الأصلي في حال تكرار المحتوى.', 'Optional: override canonical URL if content is duplicated elsewhere.') },
            },
          ],
        },
        {
          label: L('موضع التنقل والقوائم', 'Navigation & Placement'),
          fields: [
            {
              name: 'navPlacement',
              type: 'select',
              defaultValue: 'none',
              label: L('موضع الرابط في القوائم', 'Navigation Placement'),
              options: [
                { label: L('غير مدرج في القوائم', 'Not in navigation'), value: 'none' },
                { label: L('القائمة العلوية الرئيسية', 'Main Header Navigation'), value: 'primary' },
                { label: L('قائمة المزيد المنسدلة', 'More Dropdown Menu'), value: 'dropdown' },
                { label: L('الفوتر: عن المركز والحوكمة', 'Footer: About the Center'), value: 'footer_about' },
                { label: L('الفوتر: أبحاث وإصدارات', 'Footer: Research & Publications'), value: 'footer_explore' },
              ],
            },
            {
              name: 'navOrder',
              type: 'number',
              defaultValue: 0,
              label: L('الترتيب النسبي', 'Order / Priority'),
              admin: { description: L('رقم ترتيبي لتحديد أسبقية الظهور (الأقل أولاً).', 'Numeric order for sorting (lower numbers appear first).') },
            },
            localizedText('navLabel', L('تسمية الرابط المختصرة', 'Short Navigation Label'), {
              admin: { description: L('تسمية مختصرة تظهر في القائمة إن كان عنوان الصفحة طويلاً.', 'Short label shown in menu if the full page title is long.') },
            }),
          ],
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: L('المعرّف في الرابط', 'URL slug'),
      admin: { position: 'sidebar', description: L('about · contact · privacy · terms · accessibility', 'about · contact · privacy · terms · accessibility') },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      options: [
        { label: L('مسودة', 'Draft'), value: 'draft' },
        { label: L('منشور', 'Published'), value: 'published' },
        { label: L('مؤرشف', 'Archived'), value: 'archived' },
      ],
      label: L('الحالة', 'Status'),
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: L('تاريخ النشر', 'Publication Date'),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    { name: 'translationMeta', type: 'json', admin: { hidden: true } },
  ]),
};
