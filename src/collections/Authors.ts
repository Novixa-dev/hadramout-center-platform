import type { CollectionConfig } from 'payload';
import { contentAccess, L, localizedText, lockForReviewers } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: L('كاتب', 'Author'), plural: L('الكتّاب', 'Authors') },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'updatedAt'], group: L('المحتوى', 'Content'), listSearchableFields: ['name'] },
  access: { ...contentAccess, read: () => true },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateSite();
        return doc;
      },
    ],
  },
  fields: lockForReviewers([
    localizedText('name', L('الاسم', 'Name'), { required: true, admin: { description: L('يُنقحر تلقائياً للغات الأخرى.', 'Transliterated automatically for other languages.') } }),
    {
      name: 'nameKey',
      type: 'text',
      unique: true,
      index: true,
      label: L('مفتاح الدمج', 'Merge key'),
      admin: { readOnly: true, position: 'sidebar', description: L('يُستخدم لدمج تهجئات الاسم الواحد.', 'Used to merge spellings of the same name.') },
    },
    { name: 'bio', type: 'textarea', localized: true, label: L('نبذة', 'Biography') },
    { name: 'translationMeta', type: 'json', admin: { hidden: true } },
  ]),
};
