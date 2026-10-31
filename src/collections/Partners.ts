import type { CollectionConfig } from 'payload';
import { contentAccess, L, lockForReviewers, titleText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: L('شريك مؤسسي', 'Institutional partner'), plural: L('شركاء النجاح', 'Partners') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'hasWrittenConsent', 'status'],
    group: L('المحتوى', 'Content'),
  },
  defaultSort: 'order',
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
    titleText('name', L('اسم الشريك أو المؤسسة', 'Partner or institution name'), { required: true }),
    {
      name: 'category',
      type: 'select',
      defaultValue: 'academic',
      options: [
        { label: L('جامعة أو مؤسسة أكاديمية', 'University or academic institution'), value: 'academic' },
        { label: L('مركز بحثي أو توثيقي', 'Research or documentation center'), value: 'research' },
        { label: L('مؤسسة ثقافية أو تراثية', 'Cultural or heritage institution'), value: 'cultural' },
        { label: L('جهة حكومية أو دولية', 'Government or international agency'), value: 'governmental' },
      ],
      label: L('تصنيف الشراكة', 'Partnership category'),
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: L('شعار المؤسسة', 'Institution logo'),
      required: true,
    },
    {
      name: 'website',
      type: 'text',
      label: L('الموقع الإلكتروني الرسمي', 'Official website URL'),
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: L('نبذة عن مجالات التعاون المشترك', 'Summary of collaboration areas'),
    },
    {
      name: 'hasWrittenConsent',
      type: 'checkbox',
      defaultValue: false,
      label: L('موافقة نشر خطية معتمدة', 'Written publication consent confirmed'),
      admin: {
        description: L(
          'لا يُنشر الشعار للعموم دون موافقة خطية صريحة من المؤسسة الشريكة.',
          'Logos are not shown publicly without explicit written consent from the partner institution.',
        ),
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 10,
      label: L('ترتيب العرض', 'Display order'),
      admin: { position: 'sidebar' },
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
