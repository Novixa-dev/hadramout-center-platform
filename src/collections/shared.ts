import type { Access, CollectionConfig, Field, FieldAccess, TextField } from 'payload';
import { cleanTitle } from '../lib/arabic.ts';
import { sanitizeBody } from '../lib/sanitize.ts';

/** Admin labels are bilingual: the admin UI itself is Arabic-first with English available. */
export const L = (ar: string, en: string): Record<string, string> => ({ ar, en });

type Role = 'admin' | 'editor' | 'reviewer';
interface StaffUser {
  role?: Role;
}

const roleOf = (user: unknown): Role | undefined => (user as StaffUser | null | undefined)?.role;

export const isStaff: Access = ({ req }) => Boolean(req.user);
export const isAdmin: Access = ({ req }) => roleOf(req.user) === 'admin';
export const isEditorOrAdmin: Access = ({ req }) => ['admin', 'editor'].includes(roleOf(req.user) ?? '');

/** Anonymous visitors only ever see published documents. */
export const readPublished: Access = ({ req }) => (req.user ? true : { status: { equals: 'published' } });

/** Field-level: reviewers can write localized fields only in non-Arabic locales. */
export const localizedUpdate: FieldAccess = ({ req }) => {
  if (!req.user) return false;
  if (roleOf(req.user) !== 'reviewer') return true;
  return req.locale !== 'ar';
};

const notReviewer: FieldAccess = ({ req }) => roleOf(req.user) !== 'reviewer';

/**
 * Reviewers fix translations only: every field that is not localized (status, featured, dates, authors, category, files…)
 * becomes read-only for them, so the role cannot publish, unpublish or re-file a document. Rows/collapsibles are walked.
 */
export function lockForReviewers(fields: Field[]): Field[] {
  return fields.map((f): Field => {
    if ((f.type === 'row' || f.type === 'collapsible') && 'fields' in f) return { ...f, fields: lockForReviewers(f.fields) } as Field;
    if (f.type === 'tabs' && 'tabs' in f) {
      return {
        ...f,
        tabs: f.tabs.map((tab) => ('fields' in tab ? { ...tab, fields: lockForReviewers(tab.fields) } : tab)),
      } as Field;
    }
    if (!('name' in f) || ('localized' in f && f.localized)) return f;
    const access = ('access' in f ? f.access : undefined) ?? {};
    return { ...f, access: { ...access, update: access.update ?? notReviewer } } as Field;
  });
}

export const contentAccess = {
  read: readPublished,
  create: isEditorOrAdmin,
  update: isStaff,
  delete: isAdmin,
};

const STATUS_OPTIONS = [
  { label: L('مسودة', 'Draft'), value: 'draft' },
  { label: L('منشور', 'Published'), value: 'published' },
  { label: L('مؤرشف', 'Archived'), value: 'archived' },
];

const PRECISION_OPTIONS = [
  { label: L('يوم', 'Day'), value: 'day' },
  { label: L('شهر', 'Month'), value: 'month' },
  { label: L('سنة', 'Year'), value: 'year' },
  { label: L('تقديري (للترتيب فقط)', 'Estimated (sort only)'), value: 'estimated' },
  { label: L('غير معروف', 'Unknown'), value: 'none' },
];

const localizedText = (name: string, label: Record<string, string>, extra: Partial<Omit<TextField, 'hasMany'>> = {}): Field =>
  ({
    name,
    type: 'text',
    localized: true,
    label,
    access: { update: localizedUpdate },
    ...extra,
  }) as Field;

export { localizedText };

/** Every stored title/name is tidied (direction controls, kashida runs, whitespace) so search, cards and copy behave. */
export const tidyTitle = ({ value }: { value?: unknown }) => (typeof value === 'string' ? cleanTitle(value) : value);

/** A localized title or name field: like localizedText, tidied on every write. */
export const titleText = (name: string, label: Record<string, string>, extra: Partial<Omit<TextField, 'hasMany'>> = {}): Field =>
  localizedText(name, label, { ...extra, hooks: { ...extra.hooks, beforeChange: [...(extra.hooks?.beforeChange ?? []), tidyTitle] } });

/** Fields every content type shares: title/excerpt/body, cover, status, dates and import bookkeeping. */
/** Every stored body passes the same allow-list as imported/translated text (editor input is never trusted). */
export const cleanBody = ({ value }: { value?: unknown }) => (typeof value === 'string' ? sanitizeBody(value) : value);

export function baseFields(opts: { body?: boolean; cover?: boolean; date?: boolean } = {}): Field[] {
  const { body = true, cover = true, date = true } = opts;
  const fields: Field[] = [
    titleText('title', L('العنوان', 'Title'), { required: true }),
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      label: L('الملخص', 'Summary'),
      admin: { description: L('يظهر في البطاقات ونتائج البحث. يُولَّد من النص تلقائياً إن تُرك فارغاً.', 'Shown on cards and search results. Generated from the text when left empty.') },
      access: { update: localizedUpdate },
    },
  ];
  if (body) {
    fields.push({
      name: 'body',
      type: 'textarea',
      localized: true,
      hooks: { beforeValidate: [cleanBody] },
      label: L('النص', 'Body'),
      admin: { components: { Field: '/admin/fields/HtmlField#HtmlField' }, description: L('اكتب بالعربية فقط — تُترجم اللغات الأخرى تلقائياً.', 'Write in Arabic only — other languages are translated automatically.') },
      access: { update: localizedUpdate },
    });
  }
  if (cover) {
    fields.push(
      {
        name: 'cover',
        type: 'upload',
        relationTo: 'media',
        label: L('الصورة', 'Image'),
        admin: {
          position: 'sidebar',
          description: L('عرض 1200 بكسل فأكثر، بلا نص مكتوب عليها إن أمكن. تظهر أعلى الصفحة وفي بطاقة المشاركة على وسائل التواصل.', 'At least 1200 px wide, ideally without lettering. Shown at the top of the page and on the social share card.'),
        },
      },
      {
        name: 'coverUrl',
        type: 'text',
        label: L('رابط الصورة الأصلي', 'Original image URL'),
        admin: { position: 'sidebar', readOnly: true, description: L('صورة من الموقع القديم قبل نسخها محلياً.', 'Image from the legacy site, used until it is mirrored locally.') },
      },
      localizedText('coverAlt', L('وصف الصورة', 'Image description'), { admin: { position: 'sidebar' } }),
    );
  }
  fields.push(
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: STATUS_OPTIONS,
      label: L('الحالة', 'Status'),
      admin: { position: 'sidebar' },
    },
    { name: 'featured', type: 'checkbox', label: L('مميّز في الرئيسية', 'Featured on home'), defaultValue: false, admin: { position: 'sidebar' } },
  );
  if (date) {
    fields.push(
      {
        name: 'publishedAt',
        type: 'date',
        index: true,
        label: L('تاريخ النشر', 'Publication date'),
        admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
      },
      {
        name: 'datePrecision',
        type: 'select',
        defaultValue: 'day',
        options: PRECISION_OPTIONS,
        label: L('دقة التاريخ', 'Date precision'),
        admin: { position: 'sidebar', description: L('«تقديري» يُستخدم للترتيب فقط ولا يُعرض للقراء.', '"Estimated" is only used for sorting and never shown to readers.') },
      },
    );
  }
  fields.push(
    {
      name: 'legacyId',
      type: 'number',
      unique: true,
      index: true,
      label: L('رقم الموقع القديم', 'Legacy site ID'),
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'legacyUrl', type: 'text', label: L('الرابط القديم', 'Legacy URL'), admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'source',
      type: 'select',
      label: L('المصدر', 'Source'),
      defaultValue: 'manual',
      options: [
        { label: L('إدخال يدوي', 'Manual'), value: 'manual' },
        { label: L('مستورد من الموقع القديم', 'Imported from legacy'), value: 'legacy' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'edited', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
    {
      name: 'translationMeta',
      type: 'json',
      label: L('بيانات الترجمة', 'Translation metadata'),
      admin: { hidden: true },
    },
  );
  return fields;
}

/** Marks an imported document as human-edited so a re-import never overwrites it. */
export const markEdited: NonNullable<CollectionConfig['hooks']>['beforeChange'] = [
  ({ data, originalDoc, operation, req }) => {
    if (operation === 'update' && originalDoc?.source === 'legacy' && req.context?.fromImport !== true && req.context?.fromTranslation !== true) {
      data.edited = true;
    }
    return data;
  },
];
