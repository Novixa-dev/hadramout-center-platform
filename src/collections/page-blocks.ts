import type { Block } from 'payload';
import { cleanBody, L, localizedText, titleText } from './shared.ts';

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: L('ترويسة الصفحة', 'Hero Section'), plural: L('ترويسات الصفحة', 'Hero Sections') },
  fields: [
    localizedText('eyebrow', L('السطر التمهيدي', 'Eyebrow')),
    titleText('heading', L('العنوان الرئيسي', 'Heading'), { required: true }),
    { name: 'lead', type: 'textarea', localized: true, label: L('النص الموجز', 'Lead Text') },
    { name: 'image', type: 'upload', relationTo: 'media', label: L('صورة الغلاف', 'Cover Image') },
    { name: 'imageUrl', type: 'text', label: L('رابط صورة مباشر', 'Direct Image URL') },
    localizedText('imageAlt', L('النص البديل للصورة', 'Image Alt Text')),
    localizedText('ctaLabel', L('نص زر الإجراء', 'CTA Button Label')),
    { name: 'ctaUrl', type: 'text', label: L('رابط زر الإجراء', 'CTA Button URL') },
  ],
};

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: L('نص غني', 'Rich Text'), plural: L('نصوص غنية', 'Rich Texts') },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      localized: true,
      required: true,
      hooks: { beforeValidate: [cleanBody] },
      label: L('المحتوى', 'Content'),
      admin: { components: { Field: '/admin/fields/HtmlField#HtmlField' } },
    },
  ],
};

export const SectionHeadingBlock: Block = {
  slug: 'sectionHeading',
  labels: { singular: L('عنوان وقاطع قسم', 'Section Heading'), plural: L('عناوين وقواطع الأقسام', 'Section Headings') },
  fields: [
    titleText('title', L('العنوان', 'Title'), { required: true }),
    localizedText('subtitle', L('العنوان الفرعي', 'Subtitle')),
    {
      name: 'align',
      type: 'select',
      defaultValue: 'start',
      label: L('المحاذاة', 'Alignment'),
      options: [
        { label: L('البداية (يمين)', 'Start'), value: 'start' },
        { label: L('الوسط', 'Center'), value: 'center' },
      ],
    },
  ],
};

export const TextWithImageBlock: Block = {
  slug: 'textWithImage',
  labels: { singular: L('نص وصورة متوازيان', 'Text with Image'), plural: L('نصوص وصور متوازية', 'Texts with Images') },
  fields: [
    titleText('title', L('العنوان', 'Title')),
    {
      name: 'body',
      type: 'textarea',
      localized: true,
      required: true,
      hooks: { beforeValidate: [cleanBody] },
      label: L('النص', 'Body'),
      admin: { components: { Field: '/admin/fields/HtmlField#HtmlField' } },
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: L('الصورة', 'Image') },
    { name: 'imageUrl', type: 'text', label: L('رابط صورة مباشر', 'Direct Image URL') },
    localizedText('imageAlt', L('النص البديل للصورة', 'Image Alt Text')),
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'end',
      label: L('موضع الصورة', 'Image Position'),
      options: [
        { label: L('البداية (يمين بالعربية)', 'Start'), value: 'start' },
        { label: L('النهاية (يسار بالعربية)', 'End'), value: 'end' },
      ],
    },
  ],
};

export const CardGridBlock: Block = {
  slug: 'cardGrid',
  labels: { singular: L('شبكة بطاقات', 'Card Grid'), plural: L('شبكات بطاقات', 'Card Grids') },
  fields: [
    titleText('title', L('عنوان الشبكة', 'Grid Title')),
    localizedText('subtitle', L('النص الفرعي', 'Grid Subtitle')),
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      label: L('عدد الأعمدة', 'Columns'),
      options: [
        { label: L('عمودان', '2 Columns'), value: '2' },
        { label: L('3 أعمدة', '3 Columns'), value: '3' },
        { label: L('4 أعمدة', '4 Columns'), value: '4' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: L('عناصر البطاقات', 'Card Items'),
      fields: [
        titleText('title', L('عنوان البطاقة', 'Card Title'), { required: true }),
        { name: 'description', type: 'textarea', localized: true, label: L('الوصف', 'Description') },
        { name: 'icon', type: 'text', label: L('الأيقونة', 'Icon Name') },
        { name: 'link', type: 'text', label: L('الرابط', 'Link URL') },
        localizedText('badge', L('شارة أو تصنيف', 'Badge')),
      ],
    },
  ],
};

export const QuoteCalloutBlock: Block = {
  slug: 'quoteCallout',
  labels: { singular: L('مقتبس أو تنبيه', 'Quote / Callout'), plural: L('مقتبسات وتنبيهات', 'Quotes / Callouts') },
  fields: [
    { name: 'quote', type: 'textarea', localized: true, required: true, label: L('نص المقتبس أو التنبيه', 'Quote or Callout Text') },
    localizedText('attribution', L('القائل أو صاحب المقولة', 'Attribution / Author')),
    localizedText('source', L('المصدر أو المناسبة', 'Source or Reference')),
    {
      name: 'style',
      type: 'select',
      defaultValue: 'heritage',
      label: L('نمط العرض', 'Display Style'),
      options: [
        { label: L('تراثي أصيل', 'Heritage'), value: 'heritage' },
        { label: L('تنبيه معرفي', 'Informational'), value: 'info' },
        { label: L('إبراز خاص', 'Highlight'), value: 'highlight' },
      ],
    },
  ],
};

export const MediaEmbedBlock: Block = {
  slug: 'mediaEmbed',
  labels: { singular: L('تضمين مرئي أو صوتي', 'Media Embed'), plural: L('تضمينات مرئية وصوتية', 'Media Embeds') },
  fields: [
    titleText('title', L('عنوان المادة', 'Media Title')),
    { name: 'videoUrl', type: 'text', label: L('رابط الفيديو (يوتيوب أو محلي)', 'Video URL') },
    { name: 'audioUrl', type: 'text', label: L('رابط الملف الصوتي', 'Audio URL') },
    { name: 'transcript', type: 'textarea', localized: true, label: L('التفريغ المكتوب أو نبذة', 'Transcript / Notes') },
  ],
};

export const FileDownloadBlock: Block = {
  slug: 'fileDownload',
  labels: { singular: L('تنزيل ملف', 'File Download'), plural: L('تنزيلات ملفات', 'File Downloads') },
  fields: [
    titleText('title', L('اسم الملف', 'File Title'), { required: true }),
    { name: 'description', type: 'textarea', localized: true, label: L('وصف محتوى الملف', 'File Description') },
    { name: 'file', type: 'upload', relationTo: 'media', label: L('ملف من الوسائط', 'Media File') },
    { name: 'fileUrl', type: 'text', label: L('أو رابط ملف مباشر', 'Direct File URL') },
    { name: 'fileSize', type: 'text', label: L('حجم الملف التقديري', 'File Size') },
    { name: 'fileType', type: 'text', defaultValue: 'PDF', label: L('نوع الملف', 'File Type') },
  ],
};

export const StatsStripBlock: Block = {
  slug: 'statsStrip',
  labels: { singular: L('شريط إحصائيات', 'Stats Strip'), plural: L('أشرطة إحصائيات', 'Stats Strips') },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: L('الإحصائيات والأرقام', 'Stat Items'),
      fields: [
        localizedText('value', L('الرقم أو النسبة', 'Metric Value'), { required: true }),
        localizedText('label', L('الوصف التوضيحي', 'Label'), { required: true }),
        localizedText('description', L('تفاصيل إضافية', 'Additional Note')),
      ],
    },
  ],
};

export const AccordionFaqBlock: Block = {
  slug: 'accordionFaq',
  labels: { singular: L('قائمة قابلة للطي', 'Accordion / FAQ'), plural: L('قوائم قابلة للطي', 'Accordions / FAQs') },
  fields: [
    titleText('title', L('عنوان القائمة', 'Accordion Title')),
    {
      name: 'items',
      type: 'array',
      label: L('البنود أو الأسئلة', 'Items or Questions'),
      fields: [
        titleText('question', L('العنوان أو السؤال', 'Question / Title'), { required: true }),
        {
          name: 'answer',
          type: 'textarea',
          localized: true,
          required: true,
          hooks: { beforeValidate: [cleanBody] },
          label: L('التفاصيل أو الجواب', 'Answer / Details'),
          admin: { components: { Field: '/admin/fields/HtmlField#HtmlField' } },
        },
      ],
    },
  ],
};

export const CtaBoxBlock: Block = {
  slug: 'ctaBox',
  labels: { singular: L('صندوق دعوة لاتخاذ إجراء', 'Call to Action Box'), plural: L('صناديق الدعوة لاتخاذ إجراء', 'Call to Action Boxes') },
  fields: [
    titleText('title', L('العنوان المحفز', 'Action Title'), { required: true }),
    { name: 'text', type: 'textarea', localized: true, label: L('النص التوضيحي', 'Supporting Text') },
    localizedText('buttonLabel', L('نص الزر الأساسي', 'Primary Button Label'), { required: true }),
    { name: 'buttonUrl', type: 'text', required: true, label: L('رابط الزر الأساسي', 'Primary Button URL') },
    localizedText('secondaryButtonLabel', L('نص الزر الثانوي', 'Secondary Button Label')),
    { name: 'secondaryButtonUrl', type: 'text', label: L('رابط الزر الثانوي', 'Secondary Button URL') },
  ],
};

export const PAGE_BLOCKS: Block[] = [
  HeroBlock,
  RichTextBlock,
  SectionHeadingBlock,
  TextWithImageBlock,
  CardGridBlock,
  QuoteCalloutBlock,
  MediaEmbedBlock,
  FileDownloadBlock,
  StatsStripBlock,
  AccordionFaqBlock,
  CtaBoxBlock,
];
