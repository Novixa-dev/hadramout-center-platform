import type { CollectionConfig } from 'payload';
import { contentAccess, L, localizedText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: L('تصنيف', 'Category'), plural: L('التصنيفات', 'Categories') },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'kind'], group: L('المحتوى', 'Content') },
  access: { ...contentAccess, read: () => true },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateSite();
        return doc;
      },
    ],
  },
  fields: [
    localizedText('name', L('الاسم', 'Name'), { required: true }),
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'article',
      options: [
        { label: L('مقالات', 'Articles'), value: 'article' },
        { label: L('كتب', 'Books'), value: 'book' },
      ],
      label: L('يخص', 'Applies to'),
    },
    { name: 'translationMeta', type: 'json', admin: { hidden: true } },
  ],
};
