import type { CollectionConfig } from 'payload';
import { isAdmin, isStaff, L } from './shared.ts';

/** Contact / book-request / translation-issue submissions. Created only by server code (rate-limited). */
export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: L('رسالة', 'Message'), plural: L('الرسائل', 'Messages') },
  admin: { useAsTitle: 'subject', defaultColumns: ['kind', 'name', 'subject', 'status', 'createdAt'], group: L('التواصل', 'Inbox') },
  defaultSort: '-createdAt',
  access: { read: isStaff, create: () => false, update: isStaff, delete: isAdmin },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'contact',
      options: [
        { label: L('تواصل', 'Contact'), value: 'contact' },
        { label: L('طلب كتاب', 'Book request'), value: 'book_request' },
        { label: L('بلاغ عن ترجمة', 'Translation issue'), value: 'translation_issue' },
      ],
      label: L('النوع', 'Kind'),
    },
    { name: 'name', type: 'text', label: L('الاسم', 'Name') },
    { name: 'email', type: 'email', label: L('البريد', 'Email') },
    { name: 'phone', type: 'text', label: L('الهاتف', 'Phone') },
    { name: 'subject', type: 'text', label: L('الموضوع', 'Subject') },
    { name: 'body', type: 'textarea', label: L('الرسالة', 'Message') },
    { name: 'pageUrl', type: 'text', label: L('الصفحة', 'Page') },
    { name: 'lang', type: 'text', label: L('اللغة', 'Language') },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: L('جديدة', 'New'), value: 'new' },
        { label: L('مقروءة', 'Read'), value: 'read' },
        { label: L('مؤرشفة', 'Archived'), value: 'archived' },
      ],
      label: L('الحالة', 'Status'),
      admin: { position: 'sidebar' },
    },
    { name: 'ipHash', type: 'text', admin: { hidden: true } },
  ],
};

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: L('مشترك', 'Subscriber'), plural: L('مشتركو النشرة', 'Newsletter subscribers') },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'lang', 'createdAt'], group: L('التواصل', 'Inbox') },
  access: { read: isStaff, create: () => false, update: isStaff, delete: isAdmin },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true, label: L('البريد', 'Email') },
    { name: 'lang', type: 'text', defaultValue: 'ar', label: L('اللغة', 'Language') },
    { name: 'token', type: 'text', admin: { hidden: true } },
    { name: 'unsubscribedAt', type: 'date', label: L('تاريخ إلغاء الاشتراك', 'Unsubscribed at') },
  ],
};

export const TranslationUsage: CollectionConfig = {
  slug: 'translation-usage',
  labels: { singular: L('استهلاك الترجمة', 'Translation usage'), plural: L('استهلاك الترجمة', 'Translation usage') },
  admin: { useAsTitle: 'key', defaultColumns: ['day', 'provider', 'charsIn', 'charsOut', 'calls'], group: L('الترجمة', 'Translation') },
  defaultSort: '-day',
  access: { read: isStaff, create: () => false, update: () => false, delete: isAdmin },
  fields: [
    { name: 'key', type: 'text', unique: true, index: true, admin: { hidden: true } },
    { name: 'day', type: 'text', index: true, label: L('اليوم', 'Day') },
    { name: 'provider', type: 'text', label: L('المزوّد', 'Provider') },
    { name: 'charsIn', type: 'number', defaultValue: 0, label: L('أحرف مُرسلة', 'Characters sent') },
    { name: 'charsOut', type: 'number', defaultValue: 0, label: L('أحرف مستلمة', 'Characters received') },
    { name: 'calls', type: 'number', defaultValue: 0, label: L('عدد الطلبات', 'Calls') },
  ],
};
