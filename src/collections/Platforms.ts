import { APIError, type Access, type CollectionConfig, type Field } from 'payload';
import { isAdmin, isEditorOrAdmin, L } from './shared.ts';
import { hashPassword, PASSWORD_MIN } from '../lib/member-crypto.ts';
import { CURRENCIES, VOLUNTEER_AREAS, type Currency, type VolunteerArea } from '../lib/platform-requests.ts';

/**
 * The digital platforms' records: reader accounts and what visitors send the Center. Everything here is personal data, so nothing
 * is public, translation reviewers see none of it, and rows are created only by the rate-limited routes under /api/hc.
 */

const nobody: Access = () => false;
const noField = () => false;
const GROUP = L('الأعضاء والطلبات', 'Members & requests');
const notEditor = ({ user }: { user: unknown }) => (user as { role?: string } | null)?.role !== 'admin';
const staffOnlyNav = ({ user }: { user: unknown }) => !['admin', 'editor'].includes((user as { role?: string } | null)?.role ?? '');

/** What a visitor sent stays as sent: staff work on the status and their own notes. `admin.readOnly` alone guards only the form, not the REST API. */
const sealed = { update: noField };
const reference: Field = { name: 'reference', type: 'text', required: true, unique: true, index: true, access: sealed, label: L('الرقم المرجعي', 'Reference'), admin: { readOnly: true } };
const member: Field = { name: 'member', type: 'relationship', relationTo: 'members', access: sealed, label: L('حساب العضو', 'Member account'), admin: { position: 'sidebar', readOnly: true } };
const contact: Field[] = [
  { name: 'name', type: 'text', required: true, access: sealed, label: L('الاسم', 'Name'), admin: { readOnly: true } },
  { name: 'email', type: 'email', required: true, access: sealed, label: L('البريد', 'Email'), admin: { readOnly: true } },
  { name: 'phone', type: 'text', access: sealed, label: L('الهاتف', 'Phone'), admin: { readOnly: true } },
];
const statusField = (options: { value: string; label: Record<string, string> }[]): Field => ({
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'new',
  index: true,
  options,
  label: L('الحالة', 'Status'),
  admin: { position: 'sidebar', description: L('يراها العضو في حسابه إن كان الطلب مرتبطًا بحساب.', 'The member sees it in their account when the request is linked to one.') },
});
const staffNotes: Field = { name: 'staffNotes', type: 'textarea', label: L('ملاحظات الفريق (داخلية)', 'Staff notes (internal)'), admin: { position: 'sidebar' } };
const bookkeeping: Field[] = [
  { name: 'lang', type: 'text', access: sealed, admin: { hidden: true } },
  { name: 'ipHash', type: 'text', access: sealed, admin: { hidden: true } },
];

const requestAccess = { read: isEditorOrAdmin, create: nobody, update: isEditorOrAdmin, delete: isAdmin };

/** Shows an order's or a pledge's receipts on its own page in the admin; nothing is stored on the request itself. */
const receiptsOf = (on: 'order' | 'pledge'): Field => ({
  name: 'receipts',
  type: 'join',
  collection: 'receipts',
  on,
  label: L('سندات الدفع المرفوعة', 'Uploaded payment receipts'),
  admin: { defaultColumns: ['filename', 'amount', 'currency', 'status', 'createdAt'] },
});

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: L('عضو', 'Member'), plural: L('الأعضاء', 'Members') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'status', 'createdAt'],
    group: GROUP,
    hidden: notEditor,
    description: L('حسابات القراء. هي منفصلة عن حسابات الموظفين ولا تفتح لوحة التحكم.', 'Reader accounts. Separate from staff accounts; they never open this admin.'),
  },
  // Not `auth: true`, on purpose: access rules treat any req.user as staff (collections/shared.ts). See lib/member-crypto.ts.
  access: { read: isAdmin, create: nobody, update: isAdmin, delete: isAdmin },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation }) => {
        const next = data.temporaryPassword;
        delete data.temporaryPassword;
        if (operation !== 'update' || typeof next !== 'string' || !next) return data;
        if (next.length < PASSWORD_MIN) throw new APIError(`كلمة المرور المؤقتة ${PASSWORD_MIN} أحرف على الأقل / at least ${PASSWORD_MIN} characters`, 400, null, true);
        data.passwordHash = await hashPassword(next);
        // every device signed in with the old password is signed out
        data.sessionVersion = Number((originalDoc as { sessionVersion?: number } | undefined)?.sessionVersion ?? 0) + 1;
        return data;
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: L('الاسم', 'Name') },
    { name: 'email', type: 'email', required: true, unique: true, index: true, label: L('البريد', 'Email'), admin: { readOnly: true } },
    { name: 'phone', type: 'text', label: L('الهاتف', 'Phone') },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      label: L('الحالة', 'Status'),
      options: [
        { label: L('نشط', 'Active'), value: 'active' },
        { label: L('موقوف', 'Suspended'), value: 'suspended' },
      ],
      admin: { position: 'sidebar', description: L('الموقوف لا يستطيع الدخول وتنتهي جلساته فورًا.', 'A suspended member cannot sign in and their sessions end at once.') },
    },
    {
      name: 'temporaryPassword',
      type: 'text',
      virtual: true,
      label: L('تعيين كلمة مرور مؤقتة', 'Set a temporary password'),
      admin: {
        position: 'sidebar',
        description: L(
          'لا يوجد بريد لإعادة التعيين: عند طلب العضو، اكتب هنا كلمة مؤقتة (10 أحرف فأكثر) وأبلغه بها، وسيغيّرها من حسابه. لا تُحفظ ولا تُعرض.',
          'There is no reset email: when a member asks, type a temporary password here (10+ characters) and tell them; they change it from their account. It is neither stored nor shown.',
        ),
      },
    },
    { name: 'lastLoginAt', type: 'date', label: L('آخر دخول', 'Last sign-in'), admin: { position: 'sidebar', readOnly: true } },
    { name: 'passwordHash', type: 'text', hidden: true, access: { read: noField, update: noField, create: noField } },
    { name: 'sessionVersion', type: 'number', defaultValue: 0, hidden: true, access: { read: noField, update: noField, create: noField } },
    { name: 'savedItems', type: 'json', hidden: true, access: { read: noField, update: noField, create: noField } },
  ],
};

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: L('طلب شراء', 'Order'), plural: L('طلبات المتجر', 'Store orders') },
  admin: { useAsTitle: 'reference', defaultColumns: ['reference', 'name', 'phone', 'status', 'createdAt'], group: GROUP, hidden: staffOnlyNav, description: L('لا دفع إلكتروني: يتواصل الفريق مع صاحب الطلب بالتوفر والسعر وطريقة الدفع والشحن.', 'No online payment: staff contact the customer with availability, price, payment and shipping.') },
  access: requestAccess,
  defaultSort: '-createdAt',
  fields: [
    reference,
    ...contact,
    { name: 'address', type: 'textarea', required: true, access: sealed, label: L('عنوان التسليم', 'Delivery address'), admin: { readOnly: true } },
    { name: 'note', type: 'textarea', access: sealed, label: L('ملاحظة صاحب الطلب', 'Customer note'), admin: { readOnly: true } },
    {
      name: 'items',
      type: 'array',
      required: true,
      access: sealed,
      label: L('الكتب المطلوبة', 'Requested books'),
      labels: { singular: L('كتاب', 'Book'), plural: L('الكتب', 'Books') },
      admin: { readOnly: true },
      fields: [
        { name: 'book', type: 'relationship', relationTo: 'books', label: L('الكتاب', 'Book') },
        { name: 'title', type: 'text', label: L('العنوان عند الطلب', 'Title when ordered') },
        { name: 'quantity', type: 'number', required: true, min: 1, label: L('الكمية', 'Quantity') },
      ],
    },
    statusField([
      { label: L('جديد', 'New'), value: 'new' },
      { label: L('تم التأكيد', 'Confirmed'), value: 'confirmed' },
      { label: L('مدفوع', 'Paid'), value: 'paid' },
      { label: L('تم التسليم', 'Delivered'), value: 'delivered' },
      { label: L('ملغي', 'Cancelled'), value: 'cancelled' },
    ]),
    member,
    staffNotes,
    receiptsOf('order'),
    ...bookkeeping,
  ],
};

const CURRENCY_LABELS: Record<Currency, Record<string, string>> = {
  YER: L('ريال يمني', 'Yemeni rial'),
  SAR: L('ريال سعودي', 'Saudi riyal'),
  USD: L('دولار أمريكي', 'US dollar'),
  AED: L('درهم إماراتي', 'UAE dirham'),
};
export const currencyOptions = CURRENCIES.map((value) => ({ value, label: CURRENCY_LABELS[value] }));

export const Pledges: CollectionConfig = {
  slug: 'pledges',
  labels: { singular: L('نية تبرع', 'Donation pledge'), plural: L('نوايا التبرع', 'Donation pledges') },
  admin: { useAsTitle: 'reference', defaultColumns: ['reference', 'name', 'amount', 'currency', 'status', 'createdAt'], group: GROUP, hidden: staffOnlyNav, description: L('تسجيل نية فقط، ولا يُخصم أي مبلغ من الموقع. يؤكد الفريق الاستلام يدويًا.', 'A pledge only: the site never takes money. Staff confirm receipt by hand.') },
  access: requestAccess,
  defaultSort: '-createdAt',
  fields: [
    reference,
    ...contact,
    {
      type: 'row',
      fields: [
        { name: 'amount', type: 'number', min: 0, access: sealed, label: L('المبلغ المقترح', 'Suggested amount'), admin: { readOnly: true } },
        { name: 'currency', type: 'select', options: currencyOptions, access: sealed, label: L('العملة', 'Currency'), admin: { readOnly: true } },
      ],
    },
    { name: 'purpose', type: 'text', access: sealed, label: L('الغرض', 'Purpose'), admin: { readOnly: true } },
    { name: 'anonymous', type: 'checkbox', defaultValue: false, access: sealed, label: L('يفضّل عدم ذكر اسمه', 'Prefers not to be named'), admin: { readOnly: true } },
    { name: 'note', type: 'textarea', access: sealed, label: L('ملاحظة', 'Note'), admin: { readOnly: true } },
    statusField([
      { label: L('جديد', 'New'), value: 'new' },
      { label: L('تم التواصل', 'Contacted'), value: 'contacted' },
      { label: L('تم الاستلام', 'Received'), value: 'received' },
      { label: L('ملغي', 'Cancelled'), value: 'cancelled' },
    ]),
    member,
    staffNotes,
    receiptsOf('pledge'),
    ...bookkeeping,
  ],
};

/**
 * Photos of transfer receipts that visitors send for an order or a pledge. Kept outside the public media folder and served only
 * to staff through Payload's access check (collection `read`), so nobody else can open one even with its address.
 */
export const Receipts: CollectionConfig = {
  slug: 'receipts',
  labels: { singular: L('سند دفع', 'Payment receipt'), plural: L('سندات الدفع', 'Payment receipts') },
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'kind', 'amount', 'currency', 'status', 'createdAt'],
    group: GROUP,
    hidden: staffOnlyNav,
    description: L(
      'صور السندات التي يرفعها أصحاب الطلبات ونوايا التبرع. تحقق من وصول المبلغ فعلًا قبل تغيير حالة الطلب إلى «مدفوع» أو «تم الاستلام»: صورة السند وحدها ليست دليل دفع.',
      'Receipt photos sent with orders and pledges. Check that the money really arrived before marking the request paid or received: a photo alone is no proof of payment.',
    ),
  },
  access: requestAccess,
  defaultSort: '-createdAt',
  upload: {
    staticDir: process.env.RECEIPTS_DIR || `${process.env.DATA_DIR || './data'}/receipts`,
    // the route re-encodes every photo to JPEG (lib/receipt-image.ts), which also drops the location and device data a phone writes in
    mimeTypes: ['image/jpeg'],
    hideRemoveFile: true,
    crop: false,
    focalPoint: false,
  },
  hooks: {
    // The photo is what the visitor sent: staff change the status and their notes, never the file. A crop or resize request
    // (`?uploadEdits[crop]…`, the admin's image editor) rewrites the stored file without any new upload, so it is refused too:
    // `crop: false` above only hides the editor, the REST API would still honour it.
    beforeOperation: [
      ({ operation, req }) => {
        if (operation !== 'update') return;
        if (req.file || (req.query as { uploadEdits?: unknown } | undefined)?.uploadEdits !== undefined) {
          throw new APIError('لا يمكن تعديل صورة السند أو استبدالها / a receipt photo cannot be edited or replaced', 400, null, true);
        }
      },
    ],
  },
  fields: [
    { name: 'reference', type: 'text', required: true, index: true, access: sealed, label: L('الرقم المرجعي للطلب', 'Request reference'), admin: { readOnly: true } },
    {
      name: 'kind',
      type: 'select',
      required: true,
      access: sealed,
      options: [
        { label: L('طلب شراء', 'Order'), value: 'order' },
        { label: L('نية تبرع', 'Donation pledge'), value: 'pledge' },
      ],
      label: L('النوع', 'Kind'),
      admin: { readOnly: true },
    },
    { name: 'order', type: 'relationship', relationTo: 'orders', access: sealed, label: L('طلب الشراء', 'Order'), admin: { readOnly: true, condition: (d) => d?.kind === 'order' } },
    { name: 'pledge', type: 'relationship', relationTo: 'pledges', access: sealed, label: L('نية التبرع', 'Pledge'), admin: { readOnly: true, condition: (d) => d?.kind === 'pledge' } },
    {
      type: 'row',
      fields: [
        { name: 'amount', type: 'number', min: 0, access: sealed, label: L('المبلغ المحوَّل كما كتبه', 'Amount as stated'), admin: { readOnly: true } },
        { name: 'currency', type: 'select', options: currencyOptions, access: sealed, label: L('العملة', 'Currency'), admin: { readOnly: true } },
      ],
    },
    { name: 'transferRef', type: 'text', access: sealed, label: L('رقم الحوالة أو العملية', 'Transfer or transaction number'), admin: { readOnly: true } },
    { name: 'note', type: 'textarea', access: sealed, label: L('ملاحظة المرسل', 'Sender note'), admin: { readOnly: true } },
    statusField([
      { label: L('جديد', 'New'), value: 'new' },
      { label: L('تم التحقق', 'Verified'), value: 'verified' },
      { label: L('مرفوض', 'Rejected'), value: 'rejected' },
    ]),
    member,
    staffNotes,
    ...bookkeeping,
  ],
};

const AREA_LABELS: Record<VolunteerArea, Record<string, string>> = {
  documents: L('جمع الوثائق والمخطوطات', 'Collecting documents and manuscripts'),
  digitization: L('الرقمنة والفهرسة', 'Digitization and cataloguing'),
  research: L('البحث والمراجعة العلمية', 'Research and scholarly review'),
  translation: L('الترجمة', 'Translation'),
  events: L('تنظيم الفعاليات', 'Organising events'),
  media: L('الإعلام والتصوير', 'Media and photography'),
  other: L('مجال آخر', 'Something else'),
};

export const Volunteers: CollectionConfig = {
  slug: 'volunteers',
  labels: { singular: L('طلب تطوع', 'Volunteer application'), plural: L('طلبات التطوع', 'Volunteer applications') },
  admin: { useAsTitle: 'reference', defaultColumns: ['reference', 'name', 'city', 'status', 'createdAt'], group: GROUP, hidden: staffOnlyNav },
  access: requestAccess,
  defaultSort: '-createdAt',
  fields: [
    reference,
    ...contact,
    { name: 'city', type: 'text', access: sealed, label: L('المدينة', 'City'), admin: { readOnly: true } },
    { name: 'areas', type: 'select', hasMany: true, required: true, access: sealed, options: VOLUNTEER_AREAS.map((value) => ({ value, label: AREA_LABELS[value] })), label: L('مجالات التطوع', 'Areas'), admin: { readOnly: true } },
    { name: 'availability', type: 'text', access: sealed, label: L('الوقت المتاح', 'Availability'), admin: { readOnly: true } },
    { name: 'experience', type: 'textarea', required: true, access: sealed, label: L('الخبرة والدافع', 'Experience and motivation'), admin: { readOnly: true } },
    statusField([
      { label: L('جديد', 'New'), value: 'new' },
      { label: L('قيد المراجعة', 'Under review'), value: 'reviewing' },
      { label: L('مقبول', 'Accepted'), value: 'accepted' },
      { label: L('لم يُقبل', 'Declined'), value: 'declined' },
    ]),
    member,
    staffNotes,
    ...bookkeeping,
  ],
};
