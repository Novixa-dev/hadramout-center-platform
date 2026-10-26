import type { CollectionConfig, Where } from 'payload';
import { contentAccess, L, localizedText, lockForReviewers } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: L('تصنيف', 'Category'), plural: L('التصنيفات', 'Categories') },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'parent', 'kind', 'order'], group: L('المحتوى', 'Content'), description: L('مستويان: موضوع رئيسي ثم تصنيفات فرعية (أبواب المجلة وغيرها).', 'Two levels: a main topic, then sub-categories (magazine columns etc.).') },
  defaultSort: 'order',
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
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: L('الموضوع الرئيسي', 'Parent topic'),
      admin: { position: 'sidebar', description: L('اتركه فارغاً لجعل هذا التصنيف موضوعاً رئيسياً.', 'Leave empty to make this a top-level topic.') },
      // two levels only: a parent must itself be top-level
      filterOptions: ({ id }): Where => ({ and: [{ parent: { exists: false } } as Where, ...(id ? [{ id: { not_equals: id } } as Where] : [])] }),
    },
    { name: 'order', type: 'number', defaultValue: 100, label: L('الترتيب', 'Order'), admin: { position: 'sidebar', description: L('الأصغر أولاً.', 'Lower comes first.') } },
    { name: 'description', type: 'textarea', localized: true, label: L('وصف الموضوع', 'Description'), admin: { description: L('يظهر في صفحة الموضوع ومحركات البحث. اكتبه بالعربية فقط.', 'Shown on the topic page and in search results. Write in Arabic only.') } },
    { name: 'translationMeta', type: 'json', admin: { hidden: true } },
  ]),
};
