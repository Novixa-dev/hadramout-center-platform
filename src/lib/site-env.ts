/**
 * Environment of this deployment. The site is a *staging preview* unless the server explicitly says otherwise:
 * SITE_ENV=production is the one switch that lets search engines index the site and hides the preview banner.
 *
 * Safe by default on purpose: a new host or a forgotten variable can only ever produce a noindex site, never an
 * accidentally indexed preview (which would compete with the real site and has to be un-indexed slowly).
 * Read at request time (not at module load), so it works with the standalone server's runtime environment.
 */
export const isProductionSite = (): boolean => process.env.SITE_ENV === 'production';

/** Sent on every response of a staging deployment (also covers feeds, JSON, images and PDFs that cannot carry a meta tag). */
export const STAGING_ROBOTS_HEADER = 'noindex, nofollow, noarchive';
