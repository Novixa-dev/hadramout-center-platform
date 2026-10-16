import type { MetadataRoute } from 'next';
import { loadConfig } from '../config.ts';

// Read the public URL at request time: this file used to be prerendered during `docker build`,
// which baked the build placeholder host into robots.txt (and told crawlers to fetch the wrong sitemap).
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const base = loadConfig().siteUrl;
  return {
    rules: [{ userAgent: '*', allow: ['/', '/og/'], disallow: ['/admin', '/api/', '/*/search', '/*/saved'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
