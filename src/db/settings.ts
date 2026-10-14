import type { Store } from './store.ts';

/**
 * Site-wide settings stored as JSON rows. Reads are cached in memory and the cache is
 * dropped on any write, so admin edits show up immediately.
 */
export interface SiteSettings {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  address: string;
  email: string;
  phones: { label: string; number: string }[];
  whatsapp: { label: string; number: string }[];
  social: { x: string; facebook: string; instagram: string; telegram: string; youtube: string };
  coordinates: { lat: number; lng: number };
  founded: number | null;
  /** extra links shown in the footer */
  heroNote: string;
}

export const DEFAULT_SITE: SiteSettings = {
  name: 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر',
  shortName: 'مركز حضرموت',
  tagline: 'مركز علمي مستقل يُعنى بدراسة تاريخ حضرموت وحضارتها وأعلامها وتوثيقها ونشرها',
  description:
    'يعد مركز حضرموت للدراسات التاريخية والتوثيق والنشر من المراكز العلمية المستقلة، يمارس نشاطه في مجالات الدراسات والبحوث التاريخية والترجمة والتوثيق والنشر، ويخصص حيزاً كبيراً من نشاطه العلمي لدراسة تاريخ حضرموت وحضارتها وأعلامها.',
  address: 'عمارة باشريف، بجانب مسجد الغالبي، حي الشهيد خالد، المكلا، الجمهورية اليمنية',
  email: 'info@hadramout.center',
  phones: [],
  whatsapp: [
    { label: 'المكلا', number: '00967773570194' },
    { label: 'الرياض', number: '00966556408983' },
  ],
  social: {
    x: 'https://x.com/HadramoutCenter',
    facebook: 'https://www.facebook.com/hadramout.center/',
    instagram: 'https://instagram.com/hadramoutcenter',
    telegram: 'https://t.me/hadramoutcenter',
    youtube: 'https://www.youtube.com/@hadramoutcenter',
  },
  coordinates: { lat: 14.5425, lng: 49.1242 },
  founded: null,
  heroNote: '',
};

const cache = new Map<string, unknown>();

export function getSetting<T>(db: Store, key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  const row = db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  let value = fallback;
  if (row) {
    try {
      value = JSON.parse(row.value) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, value);
  return value;
}

export function setSetting(db: Store, key: string, value: unknown): void {
  db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, JSON.stringify(value));
  cache.delete(key);
}

export function clearSettingsCache(): void {
  cache.clear();
}

export function getSite(db: Store): SiteSettings {
  return { ...DEFAULT_SITE, ...getSetting<Partial<SiteSettings>>(db, 'site', {}) };
}
