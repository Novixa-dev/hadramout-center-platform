import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر',
    short_name: 'مركز حضرموت',
    description: 'أرشيف رقمي مفتوح: دراسات وكتب ومجلة وفعاليات علمية',
    start_url: '/',
    display: 'standalone',
    lang: 'ar',
    dir: 'rtl',
    background_color: '#fffbf5',
    theme_color: '#226a5a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
