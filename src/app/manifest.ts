import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/ar',
    name: 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر',
    short_name: 'مركز حضرموت',
    description: 'أرشيف رقمي مفتوح: دراسات وكتب ومجلة وفعاليات علمية',
    start_url: '/ar',
    scope: '/',
    display: 'standalone',
    lang: 'ar',
    dir: 'rtl',
    background_color: '#0e1815',
    theme_color: '#0e1815',
    categories: ['education', 'books', 'news', 'history'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'البحث', short_name: 'بحث', url: '/ar/search', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'المقالات والدراسات', short_name: 'دراسات', url: '/ar/articles' },
      { name: 'الكتب', short_name: 'كتب', url: '/ar/books' },
      { name: 'مجلة حضرموت', short_name: 'المجلة', url: '/ar/magazines' },
    ],
  };
}
