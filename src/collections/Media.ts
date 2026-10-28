import type { CollectionConfig } from 'payload';
import { L, localizedText, isEditorOrAdmin, isAdmin } from './shared.ts';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: L('ملف وسائط', 'Media file'), plural: L('الوسائط', 'Media') },
  admin: { group: L('المحتوى', 'Content'), useAsTitle: 'filename' },
  access: { read: () => true, create: isEditorOrAdmin, update: isEditorOrAdmin, delete: isAdmin },
  upload: {
    staticDir: process.env.MEDIA_DIR || './data/media',
    // Raster images and PDF only. `image/*` also admitted SVG, which can carry script and is served from this origin
    // (/api/media/file/…): an editor account could plant a file that acts with an administrator's session when opened (SEC-013).
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'application/pdf'],
    adminThumbnail: 'thumb',
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 320, formatOptions: { format: 'webp', options: { quality: 75 } } },
      { name: 'card', width: 720, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'large', width: 1400, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
  },
  fields: [
    localizedText('alt', L('وصف الصورة (للقارئات الصوتية)', 'Alt text'), { admin: { description: L('وصف مختصر لمحتوى الصورة.', 'Short description of the image.') } }),
    { name: 'sourceUrl', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar' }, label: L('المصدر الأصلي', 'Original source') },
  ],
};
