import type { CollectionConfig } from 'payload';
import { cleanBody, contentAccess, L, lockForReviewers, localizedText, titleText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';
import { PAGE_BLOCKS } from './page-blocks.ts';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: L('صفحة', 'Page'), plural: L('الصفحات', 'Pages') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'navPlacement', 'updatedAt'],
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
    titleText('title', L('عنوان الصفحة', 'Page Title'), { required: true }),
    {
      type: 'tabs',
      tabs: [
        {
          label: L('المحتوى والترويسة', 'Content & Hero'),
          fields: [
            localizedText('badge', L('شارة الترويسة', 'Hero Badge'), {
              admin: {
                description: L(
                  'شارة تصنيف تظهر أعلى العنوان الرئيسي (مثل: عن المركز، وثيقة رسمية، تعريف).',
                  'Category badge shown above title (e.g. About the Center, Official Document).',
                ),
              },
            }),
            {
              name: 'lead',
              type: 'textarea',
              localized: true,
              label: L('المقدمة البارزة (Lead / Subtitle)', 'Hero Lead / Subtitle'),
              admin: {
                description: L(
                  'مقدمة موجزة تُلخص جوهر الصفحة وتظهر أسفل العنوان بحجم مائل وبارز.',
                  'Brief overview summarizing the page displayed prominently under the title.',
                ),
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'heroLayout',
                  type: 'select',
                  defaultValue: 'standard',
                  label: L('نمط الترويسة والعرض', 'Hero Layout Style'),
                  options: [
                    { label: L('قياسي كلاسيكي', 'Standard Classic'), value: 'standard' },
                    { label: L('توسيط كامل', 'Centered Full'), value: 'centered' },
                    { label: L('بانر عريض مع خلفية', 'Wide Banner Background'), value: 'banner' },
                    { label: L('شاشة منقسمة (نص وصورة)', 'Split Screen (Text & Media)'), value: 'split' },
                    { label: L('موجز ومبسط', 'Minimal Compact'), value: 'minimal' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'heroImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: L('صورة ترويسة الصفحة', 'Hero Cover Image'),
                  admin: {
                    width: '50%',
                    description: L('صورة اختيارية للترويسة.', 'Optional hero cover image.'),
                  },
                },
              ],
            },
            {
              name: 'blocks',
              type: 'blocks',
              blocks: PAGE_BLOCKS,
              label: L('الكتل البنائية التفاعلية', 'Interactive Page Blocks'),
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
          label: L('محركات البحث والشبكات (SEO)', 'SEO & Social'),
          fields: [
            {
              name: 'serpPreview',
              type: 'ui',
              label: L('معاينة نتائج محركات البحث والتواصل', 'Search & Social Share Preview'),
              admin: {
                components: { Field: '/admin/fields/SerpPreview#SerpPreview' },
              },
            },
            localizedText('metaTitle', L('عنوان محركات البحث', 'SEO Title'), {
              admin: {
                description: L(
                  'عنوان مخصص يظهر في نتائج البحث وشريط المتصفح (50-60 حرفاً).',
                  'Custom title shown in search results and browser tab (50-60 chars).',
                ),
              },
            }),
            {
              name: 'metaDescription',
              type: 'textarea',
              localized: true,
              label: L('الوصف التعريفي', 'Meta Description'),
              admin: {
                description: L(
                  'ملخص موجز يظهر في نتائج محركات البحث (120-155 حرفاً).',
                  'Brief summary shown under search engine results (120-155 chars).',
                ),
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ogImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: L('صورة المشاركة الاجتماعية (OG Image)', 'Social Share Image (OG)'),
                  admin: {
                    width: '50%',
                    description: L(
                      'صورة بنسبة 1200×630 تظهر عند مشاركة الرابط.',
                      'Image (1200x630) shown when sharing on social media.',
                    ),
                  },
                },
                {
                  name: 'schemaType',
                  type: 'select',
                  defaultValue: 'WebPage',
                  label: L('نوع المخطط الدلالي (Schema.org)', 'Schema.org Type'),
                  options: [
                    { label: L('صفحة عامة (WebPage)', 'Generic WebPage'), value: 'WebPage' },
                    { label: L('عن المركز (AboutPage)', 'About Page'), value: 'AboutPage' },
                    { label: L('اتصال وتواصل (ContactPage)', 'Contact Page'), value: 'ContactPage' },
                    { label: L('صفحة تعريفية / مادة (ItemPage)', 'Item Page'), value: 'ItemPage' },
                    { label: L('مجموعة / أرشيف (CollectionPage)', 'Collection Page'), value: 'CollectionPage' },
                  ],
                  admin: {
                    width: '50%',
                    description: L('تحديد النوع الدلالي للمساعدة في تحسين الفهرسة.', 'Semantic type for rich search snippets.'),
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'canonicalUrl',
                  type: 'text',
                  label: L('الرابط القياسي (Canonical URL)', 'Canonical URL'),
                  admin: {
                    width: '60%',
                    description: L('اختياري: لتحديد الرابط الأصلي في حال تكرار المحتوى.', 'Optional: override canonical URL if duplicated.'),
                  },
                },
                {
                  name: 'noindex',
                  type: 'checkbox',
                  defaultValue: false,
                  label: L('حجب من الفهرسة (noindex)', 'Block from indexing (noindex)'),
                  admin: {
                    width: '40%',
                    description: L('تفعيل هذا الخيار يطلب من محركات البحث عدم فهرسة الصفحة.', 'Tells crawlers not to index this page.'),
                  },
                },
              ],
            },
          ],
        },
        {
          label: L('موضع التنقل والقوائم', 'Navigation & Placement'),
          fields: [
            {
              type: 'row',
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
                  admin: { width: '50%' },
                },
                {
                  name: 'navOrder',
                  type: 'number',
                  defaultValue: 0,
                  label: L('الترتيب النسبي', 'Order / Priority'),
                  admin: {
                    width: '50%',
                    description: L('رقم ترتيبي لتحديد أسبقية الظهور (الأقل أولاً).', 'Numeric order for sorting (lower first).'),
                  },
                },
              ],
            },
            localizedText('navLabel', L('تسمية الرابط المختصرة', 'Short Navigation Label'), {
              admin: {
                description: L(
                  'تسمية مختصرة تظهر في القائمة إن كان عنوان الصفحة طويلاً.',
                  'Short label shown in menu if the full page title is long.',
                ),
              },
            }),
            {
              name: 'showBreadcrumbs',
              type: 'checkbox',
              defaultValue: true,
              label: L('إظهار مسار التنقل (Breadcrumbs)', 'Show Breadcrumbs'),
              admin: {
                description: L(
                  'عرض شريط المسار الهرمي في أعلى الصفحة لتسهيل تنقل الزائر.',
                  'Display hierarchical breadcrumbs trail at the top of the page.',
                ),
              },
            },
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
      admin: {
        position: 'sidebar',
        description: L('about · contact · privacy · terms · accessibility', 'about · contact · privacy · terms · accessibility'),
      },
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
    {
      name: 'scheduledPublish',
      type: 'date',
      label: L('موعد الجدولة المسبقة للنشر', 'Scheduled Publish Date'),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: L(
          'تحديد تاريخ ووقت مستقبلي لإطلاق الصفحة وتفعيل نشرها.',
          'Set a future date and time for scheduled launch.',
        ),
      },
    },
    {
      name: 'editorialNotes',
      type: 'textarea',
      label: L('ملاحظات التحرير والمراجعة الداخلية', 'Internal Editorial Notes'),
      admin: {
        position: 'sidebar',
        description: L(
          'توثيق داخلي للمصادر، مراجع التدقيق، والملاحظات الخاصة بفريق العمل (لا تظهر للزوار).',
          'Internal team notes, source citations, and review instructions (never visible to visitors).',
        ),
      },
    },
    { name: 'translationMeta', type: 'json', admin: { hidden: true } },
  ]),
};
