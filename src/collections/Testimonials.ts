import type { CollectionConfig } from 'payload';
import { contentAccess, L, localizedText, lockForReviewers, titleText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: L('شهادة أو انطباع', 'Testimonial or endorsement'), plural: L('قالوا عن المركز', 'Testimonials') },
  admin: {
    useAsTitle: 'personName',
    defaultColumns: ['personName', 'institution', 'hasWrittenConsent', 'status'],
    group: L('المحتوى', 'Content'),
  },
  defaultSort: '-date',
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
    titleText('personName', L('اسم الشخصية أو الباحث', 'Person or scholar name'), { required: true }),
    localizedText('personTitle', L('الصفة أو المنصب العلمي', 'Title or scholarly position')),
    localizedText('institution', L('المؤسسة أو الجامعة التابع لها', 'Affiliated institution or university')),
    {
      name: 'quote',
      type: 'textarea',
      localized: true,
      required: true,
      label: L('نص الشهادة أو الانطباع', 'Testimonial or quote text'),
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: L('الصورة الشخصية', 'Personal photo or avatar'),
    },
    {
      name: 'source',
      type: 'text',
      label: L('مناسبة الشهادة أو المصدر المرجعي', 'Occasion or source reference'),
      admin: {
        description: L('مثال: سجل التشريفات، كلمة في مؤتمر، تصريح صحفي.', 'e.g. Guestbook, conference speech, press statement.'),
      },
    },
    {
      name: 'hasWrittenConsent',
      type: 'checkbox',
      defaultValue: false,
      label: L('موافقة نشر موثقة ومعتمدة', 'Verified publication consent'),
      admin: {
        description: L('تأكيد موافقة صاحب الشهادة على النشر للعموم في الموقع.', 'Confirm the author gave permission to publish publicly on the site.'),
      },
    },
    {
      name: 'date',
      type: 'date',
      label: L('تاريخ الشهادة', 'Testimonial date'),
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: L('مسودة', 'Draft'), value: 'draft' },
        { label: L('معتمد للنشر', 'Approved for publish'), value: 'published' },
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
