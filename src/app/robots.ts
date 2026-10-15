import type { MetadataRoute } from 'next';
import { loadConfig } from '../config.ts';

export default function robots(): MetadataRoute.Robots {
  const base = loadConfig().siteUrl;
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/*/search', '/*/saved'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
