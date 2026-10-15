import type { GlobalConfig } from 'payload';
import { isEditorOrAdmin, L, localizedText } from '../collections/shared.ts';
import { revalidateSite } from '../hooks/revalidate.ts';

export const Site: GlobalConfig = {
  slug: 'site',
  label: L('إعدادات الموقع', 'Site settings'),
  admin: { group: L('الإدارة', 'Administration') },
  access: { read: () => true, update: isEditorOrAdmin },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateSite();
        return doc;
      },
    ],
  },
  fields: [
    localizedText('name', L('اسم المركز', 'Center name'), { required: true }),
    localizedText('shortName', L('الاسم المختصر', 'Short name')),
    { name: 'tagline', type: 'textarea', localized: true, label: L('الشعار النصي', 'Tagline') },
    { name: 'description', type: 'textarea', localized: true, label: L('التعريف بالمركز', 'About the center') },
    { name: 'address', type: 'textarea', localized: true, label: L('العنوان', 'Address') },
    { name: 'email', type: 'email', label: L('البريد الإلكتروني', 'Email') },
    {
      name: 'whatsapp',
      type: 'array',
      label: L('أرقام واتساب', 'WhatsApp numbers'),
      fields: [
        { name: 'label', type: 'text', label: L('الوصف', 'Label') },
        { name: 'number', type: 'text', required: true, label: L('الرقم (بصيغة دولية)', 'Number (international)') },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: L('وسائل التواصل', 'Social links'),
      fields: [
        { name: 'x', type: 'text', label: 'X' },
        { name: 'facebook', type: 'text', label: 'Facebook' },
        { name: 'instagram', type: 'text', label: 'Instagram' },
        { name: 'telegram', type: 'text', label: 'Telegram' },
        { name: 'youtube', type: 'text', label: 'YouTube' },
      ],
    },
    { name: 'reviewsEnabled', type: 'checkbox', defaultValue: true, label: L('تفعيل مراجعات القراء', 'Enable reader reviews'), admin: { description: L('تظهر المراجعة بعد موافقة المحرر فقط.', 'A review is shown only after an editor approves it.') } },
    { name: 'translationMeta', type: 'json', admin: { hidden: true } },
  ],
};
