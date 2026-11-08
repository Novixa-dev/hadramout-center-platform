import type { CollectionConfig } from 'payload';
import { cleanBody, contentAccess, L, localizedText, lockForReviewers, titleText } from './shared.ts';
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
      name: 'kind',
      type: 'select',
      defaultValue: 'event',
      label: L('نوع الإعلان', 'Announcement type'),
      options: [
        { value: 'conference', label: L('مؤتمر', 'Conference') },
        { value: 'seminar', label: L('ندوة', 'Seminar') },
        { value: 'lecture', label: L('محاضرة', 'Lecture') },
        { value: 'forum', label: L('فعالية منتدى عميد الوفاء', 'Forum event') },
        { value: 'call', label: L('دعوة للمشاركة', 'Call for participation') },
        { value: 'event', label: L('فعالية أخرى', 'Other event') },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      label: L('تثبيت في الشريط العلوي', 'Pin to the top bar'),
      admin: { position: 'sidebar', description: L('يظهر في الشريط البارز أعلى كل الصفحات حتى انتهائه.', 'Shown in the bar at the top of every page until it expires.') },
    },
    {
      name: 'showOnHome',
      type: 'checkbox',
      defaultValue: true,
      label: L('إظهار في الصفحة الرئيسية', 'Show on the home page'),
      admin: { position: 'sidebar', description: L('يظهر في قسم الإعلانات بالرئيسية حتى انتهائه.', 'Shown in the home page announcements until it expires.') },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: L('الصورة المميزة', 'Featured image'),
      admin: { position: 'sidebar' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      label: L('الملخص', 'Summary'),
      admin: { description: L('يظهر في البطاقة وفي وصف التقويم.', 'Shown on the card and in the calendar entry.') },
    },
    localizedText('venue', L('المكان', 'Venue')),
    { name: 'link', type: 'text', label: L('رابط التفاصيل أو التسجيل', 'Details or registration link') },
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
        description: L('يختفي الإعلان تلقائياً بعد هذا التاريخ. إن تُرك فارغاً ينتهي بعد يوم الفعالية.', 'Hidden automatically after this date. When empty it ends after the event day.'),
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
