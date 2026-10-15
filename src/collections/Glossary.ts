import type { CollectionConfig } from 'payload';
import { isEditorOrAdmin, isStaff, isAdmin, L } from './shared.ts';
import { LANGUAGES } from '../i18n/languages.ts';

export const Glossary: CollectionConfig = {
  slug: 'glossary',
  labels: { singular: L('مصطلح', 'Glossary term'), plural: L('قاموس المصطلحات', 'Translation glossary') },
  admin: {
    useAsTitle: 'termAr',
    defaultColumns: ['termAr', 'lang', 'translation', 'kind'],
    group: L('الترجمة', 'Translation'),
    description: L('مصطلحات وأسماء أعلام وأماكن تُترجم بصيغة ثابتة في كل المحتوى (مثل: سمهرم ← Sumhuram).', 'Terms, names and places that are always translated the same way (e.g. سمهرم → Sumhuram).'),
  },
  access: { read: isStaff, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isAdmin },
  fields: [
    { name: 'termAr', type: 'text', required: true, index: true, label: L('المصطلح بالعربية', 'Arabic term') },
    {
      name: 'lang',
      type: 'select',
      required: true,
      defaultValue: 'en',
      label: L('اللغة', 'Language'),
      options: [{ label: L('كل اللغات', 'All languages'), value: '*' }, ...LANGUAGES.filter((l) => l.code !== 'ar').map((l) => ({ label: `${l.native} (${l.code})`, value: l.code }))],
      admin: { description: L('الإنجليزية تُستخدم أيضاً كصيغة لاتينية مرجعية لبقية اللغات.', 'English also acts as the canonical Latin spelling for other languages.') },
    },
    { name: 'translation', type: 'text', required: true, label: L('الترجمة المعتمدة', 'Approved rendering') },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'term',
      label: L('النوع', 'Kind'),
      options: [
        { label: L('مصطلح', 'Term'), value: 'term' },
        { label: L('شخص', 'Person'), value: 'person' },
        { label: L('مكان', 'Place'), value: 'place' },
        { label: L('مؤسسة', 'Organization'), value: 'org' },
        { label: L('لا يُترجم', 'Keep as is'), value: 'keep' },
      ],
    },
  ],
};
