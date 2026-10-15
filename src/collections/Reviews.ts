import type { CollectionConfig } from 'payload';
import { isAdmin, isEditorOrAdmin, L } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

/**
 * Reader reviews of books, studies and magazine issues. Visitors submit through /api/hc/reviews (honeypot, rate limit,
 * sanitized text, always stored as "pending"); nothing is public until an editor approves it here.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: L('مراجعة قارئ', 'Reader review'), plural: L('مراجعات القراء', 'Reader reviews') },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'rating', 'targetType', 'targetId', 'status', 'createdAt'], group: L('المجتمع', 'Community') },
  defaultSort: '-createdAt',
  access: { read: isEditorOrAdmin, create: () => false, update: isEditorOrAdmin, delete: isAdmin },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateSite();
        return doc;
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'targetType',
          type: 'select',
          required: true,
          index: true,
          options: [
            { label: L('كتاب', 'Book'), value: 'book' },
            { label: L('مقال / دراسة', 'Article / study'), value: 'article' },
            { label: L('عدد مجلة', 'Magazine issue'), value: 'magazine' },
          ],
          label: L('المراجَع', 'Reviewed item'),
        },
        { name: 'targetId', type: 'number', required: true, index: true, label: L('رقم المادة', 'Item ID') },
      ],
    },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5, label: L('التقييم (1–5)', 'Rating (1–5)') },
    { name: 'name', type: 'text', maxLength: 80, label: L('الاسم', 'Name') },
    { name: 'body', type: 'textarea', required: true, maxLength: 2000, label: L('نص المراجعة', 'Review') },
    { name: 'lang', type: 'text', maxLength: 12, label: L('لغة الصفحة', 'Page language'), admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'pending',
      options: [
        { label: L('بانتظار الموافقة', 'Pending'), value: 'pending' },
        { label: L('موافَق عليها', 'Approved'), value: 'approved' },
        { label: L('مرفوضة', 'Rejected'), value: 'rejected' },
      ],
      label: L('الحالة', 'Status'),
      admin: { position: 'sidebar' },
    },
    { name: 'fingerprint', type: 'text', admin: { hidden: true }, index: true },
  ],
};
