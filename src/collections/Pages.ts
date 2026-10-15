import type { CollectionConfig } from 'payload';
import { cleanBody, contentAccess, L, localizedText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: L('صفحة', 'Page'), plural: L('الصفحات', 'Pages') },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'status'], group: L('المحتوى', 'Content') },
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
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: L('المعرّف في الرابط', 'URL slug'),
      admin: { position: 'sidebar', description: L('about · contact · privacy · terms · accessibility', 'about · contact · privacy · terms · accessibility') },
    },
    {
      name: 'body',
      type: 'textarea',
      localized: true,
      hooks: { beforeValidate: [cleanBody] },
      label: L('النص', 'Body'),
      admin: { components: { Field: '/admin/fields/HtmlField#HtmlField' } },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
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
