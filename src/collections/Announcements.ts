import type { CollectionConfig } from 'payload';
import { cleanBody, contentAccess, L, lockForReviewers, titleText } from './shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: { singular: L('إعلان رسمي', 'Official announcement'), plural: L('الإعلانات والتعاميم', 'Announcements & circulars') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'pinned', 'expiresAt', 'status'],
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
    titleText('title', L('عنوان الإعلان', 'Announcement title'), { required: true }),
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      label: L('تثبيت في أعلى الموقع', 'Pin to top of site'),
      admin: { position: 'sidebar', description: L('يظهر في الشريط البارز في أعلى الصفحة الرئيسية.', 'Featured prominently at the top of the homepage.') },
    },
    {
      name: 'body',
      type: 'textarea',
      localized: true,
      hooks: { beforeValidate: [cleanBody] },
      label: L('نص الإعلان', 'Announcement body'),
      admin: {
        components: { Field: '/admin/fields/HtmlField#HtmlField' },
        description: L('النص الكامل للإعلان أو التعميم.', 'The full text of the announcement or circular.'),
      },
    },
    {
      name: 'attachment',
      type: 'upload',
      relationTo: 'media',
      label: L('مرفق الإعلان (PDF أو صورة)', 'Announcement attachment (PDF or image)'),
    },
    {
      name: 'attachmentUrl',
      type: 'text',
      label: L('رابط خارجي للمرفق', 'External attachment URL'),
    },
    {
      name: 'eventDate',
      type: 'date',
      label: L('موعد الفعالية أو الموعد النهائي', 'Event date or submission deadline'),
      admin: { date: { pickerAppearance: 'dayAndTime' }, description: L('إن كان الإعلان مرتبطاً بورشة، مؤتمر، أو موعد نهائي لاستلام البحوث.', 'If the announcement concerns a workshop, conference, or call for papers deadline.') },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: L('تاريخ انتهاء صلاحية الإعلان', 'Expiration date'),
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        position: 'sidebar',
        description: L('يختفي الإعلان من الإعلانات البارزة تلقائياً بعد هذا التاريخ.', 'The announcement disappears from prominent displays after this date.'),
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
      defaultValue: 'published',
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
