import type { MetadataRoute } from 'next';
import { loadConfig } from '../config.ts';
import { isProductionSite } from '../lib/site-env.ts';

// Read the public URL at request time: this file used to be prerendered during `docker build`,
// which baked the build placeholder host into robots.txt (and told crawlers to fetch the wrong sitemap).
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  // Staging: crawlers may fetch pages (they must, to see the noindex meta tag and X-Robots-Tag header — a Disallow would hide it),
  // but no sitemap is advertised. See docs/05-deploy/03-move-to-new-host-and-domain.md.
  if (!isProductionSite()) return { rules: [{ userAgent: '*', allow: '/' }] };
  const base = loadConfig().siteUrl;
  return {
    rules: [{ userAgent: '*', allow: ['/', '/og/'], disallow: ['/admin', '/api/', '/*/search', '/*/saved'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
