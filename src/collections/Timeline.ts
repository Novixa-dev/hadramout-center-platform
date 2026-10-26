import type { CollectionConfig } from 'payload';
import { contentAccess, L, localizedText, lockForReviewers, titleText } from './shared.ts';
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
  fields: lockForReviewers([
    titleText('title', L('العنوان', 'Title'), { required: true }),
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
    { name: 'sourceUrl', type: 'text', label: L('رابط المصدر', 'Source link') },
    { name: 'relatedArticle', type: 'relationship', relationTo: 'articles', label: L('دراسة ذات صلة', 'Related study'), admin: { description: L('اربط الحدث بدراسة منشورة في الأرشيف عند توفرها.', 'Link the event to a published study in the archive when one exists.') } },
    {
      type: 'row',
      fields: [
        {
          name: 'reviewStatus',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: L('بانتظار مراجعة اللجنة العلمية', 'Awaiting scientific review'), value: 'pending' },
            { label: L('راجعته اللجنة العلمية', 'Reviewed by the scientific committee'), value: 'reviewed' },
          ],
          label: L('حالة المراجعة', 'Review status'),
        },
        { name: 'reviewedAt', type: 'date', label: L('تاريخ المراجعة', 'Reviewed on'), admin: { date: { pickerAppearance: 'dayOnly' } } },
      ],
    },
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
  ]),
};
