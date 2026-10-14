import type { CollectionConfig } from 'payload';
import { contentAccess, L, localizedText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Timeline: CollectionConfig = {
  slug: 'timeline',
  labels: { singular: L('حدث تاريخي', 'Timeline event'), plural: L('الخط الزمني', 'Timeline') },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'yearFrom', 'status'], group: L('المحتوى', 'Content') },
  defaultSort: 'yearFrom',
  access: contentAccess,
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateSite();
        return doc;
      },
    ],
  },
  fields: [
    localizedText('title', L('العنوان', 'Title'), { required: true }),
    { name: 'body', type: 'textarea', localized: true, label: L('الوصف', 'Description') },
    localizedText('era', L('العصر', 'Era')),
    {
      type: 'row',
      fields: [
        { name: 'yearFrom', type: 'number', required: true, label: L('من سنة (سالب = ق.م)', 'From year (negative = BCE)') },
        { name: 'yearTo', type: 'number', label: L('إلى سنة', 'To year') },
      ],
    },
    { name: 'source', type: 'text', label: L('المصدر', 'Source'), admin: { description: L('اذكر المرجع العلمي لكل حدث.', 'Cite the scholarly reference for each event.') } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: L('مسودة', 'Draft'), value: 'draft' },
        { label: L('منشور', 'Published'), value: 'published' },
      ],
      label: L('الحالة', 'Status'),
      admin: { position: 'sidebar' },
    },
    { name: 'translationMeta', type: 'json', admin: { hidden: true } },
  ],
};
