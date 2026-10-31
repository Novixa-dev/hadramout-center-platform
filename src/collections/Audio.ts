import type { CollectionConfig } from 'payload';
import { cleanBody, contentAccess, L, localizedText, lockForReviewers, titleText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Audio: CollectionConfig = {
  slug: 'audio',
  labels: { singular: L('تسجيل صوتي', 'Audio recording'), plural: L('التسجيلات الصوتية والبودكاست', 'Audio & podcasts') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'presenter', 'duration', 'status'],
    group: L('المحتوى', 'Content'),
  },
  defaultSort: '-publishedAt',
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
    titleText('title', L('عنوان التسجيل الصوتي', 'Audio recording title'), { required: true }),
    {
      name: 'audioFile',
      type: 'upload',
      relationTo: 'media',
      label: L('ملف الصوت المرفوع', 'Uploaded audio file'),
      admin: { description: L('ارفع ملف الصوت (MP3 / M4A / WAV).', 'Upload an audio file (MP3 / M4A / WAV).') },
    },
    {
      name: 'audioUrl',
      type: 'text',
      label: L('رابط البث أو ملف الصوت الخارجي', 'External streaming or audio URL'),
      admin: { description: L('رابط مباشر لملف MP3 أو منصة بودكاست أو ساوندكلاود.', 'Direct MP3 link, podcast platform, or SoundCloud stream URL.') },
    },
    localizedText('presenter', L('مقدم البرنامج / المتحدث', 'Presenter / Speaker')),
    localizedText('program', L('اسم البرنامج أو السلسلة', 'Program / Series')),
    {
      name: 'duration',
      type: 'text',
      label: L('المدة', 'Duration'),
      admin: { description: L('المدة التقريبية للتسجيل (مثال: 45:00 أو 45 دقيقة).', 'Approximate recording duration (e.g. 45:00 or 45 mins).') },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: L('غلاف الحلقة / التسجيل', 'Episode / Recording cover'),
      admin: { position: 'sidebar' },
    },
    {
      name: 'body',
      type: 'textarea',
      localized: true,
      hooks: { beforeValidate: [cleanBody] },
      label: L('التفريغ الصوتي أو ملخص الحلقة', 'Audio transcript / Episode summary'),
      admin: {
        components: { Field: '/admin/fields/HtmlField#HtmlField' },
        description: L('نص مفرغ للتسجيل الصوتي أو تفاصيل المحتوى.', 'Full transcript of the audio recording or detailed episode notes.'),
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: L('تاريخ النشر', 'Published date'),
      admin: { date: { pickerAppearance: 'dayOnly' }, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: L('مسودة', 'Draft'), value: 'draft' },
        { label: L('منشور', 'Published'), value: 'published' },
      ],
      label: L('الحالة', 'Status'),
      admin: { position: 'sidebar' },
    },
    {
      name: 'translationMeta',
      type: 'json',
      admin: { hidden: true },
    },
  ]),
};
