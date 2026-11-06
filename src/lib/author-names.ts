/**
 * Separates an academic or honorific title from an Arabic author name ("أ.د. فلان" → honorific "أ.د.", name "فلان").
 *
 * Titles belong in the `honorific` field: the alphabetical index, search and the merge key must see the name alone, while cards
 * and structured data still show "title + name". The legacy import stored them glued together.
 * Pure and deterministic: the data migration and the seeder both use it, so a fresh seed and the live database agree.
 */

export interface SplitName {
  name: string;
  honorific: string;
}

/** Prefix rules, most specific first. Each regex must consume the whitespace after the title. */
const PREFIXES: { re: RegExp; honorific: string }[] = [
  { re: /^(?:أ\.م\.د\.|أ\.م\.د)\s+/u, honorific: 'أ.م.د.' },
  { re: /^(?:أ\.\s*د\.?|الأستاذ\s+الدكتور)\s+/u, honorific: 'أ.د.' },
  { re: /^(?:د\.\s*|د\s+|الدكتور\s+)/u, honorific: 'د.' },
  { re: /^الشيخ\s*[:/]?\s+/u, honorific: 'الشيخ' },
  { re: /^الباحث\s*[:/]?\s+/u, honorific: 'الباحث' },
  { re: /^القاضي\s+/u, honorific: 'القاضي' },
  { re: /^السيد\s+العلامة\s+الفقيه\s+القاضي\s+المؤرخ\s+/u, honorific: 'السيد العلامة' },
  { re: /^م\.\s+/u, honorific: 'م.' },
  { re: /^أ\.\s*(?=\p{L}{2})/u, honorific: 'أ.' }, // "أ. فلان" (Ustadh): needs a real word after it, so the initials in "أ.م.د" are not eaten
];

/** Initials of a Russian name such as "م.أ. رودينوف" look like the engineer's "م." but are not a title. */
const FOREIGN_INITIALS = /^م\.أ\./u;

/** An editorial role appended to a name ("د. فلان - رئيس التحرير") is not part of the name. */
const TRAILING_ROLE = /\s*[-–—]\s*رئيس\s+التحرير\s*$/u;

/** The split of `raw`, or null when there is nothing to separate (or the name must be left alone). */
export function splitHonorific(raw: string): SplitName | null {
  const input = raw.replace(TRAILING_ROLE, '').trim();
  if (FOREIGN_INITIALS.test(input)) return null;
  for (const { re, honorific } of PREFIXES) {
    if (!re.test(input)) continue;
    const name = input.replace(re, '').trim();
    // a title with nothing after it is not a name to split: leave it for the editors (the quality report lists it)
    return name ? { name, honorific } : null;
  }
  return input !== raw.trim() ? { name: input, honorific: '' } : null;
}

/** A byline fragment that is only a title ("الشيخ", "أ.م.د"): the legacy import cut "الشيخ/ فلان" at the slash. */
export const isBareTitle = (name: string): boolean => /^(?:أ\.\s*م\.\s*د|أ\.\s*د|أ|د|الشيخ|الدكتور|الأستاذ|الباحث|القاضي|م)\.?$/u.test(name.trim());

/** Glues each bare-title fragment back onto the name that follows it: ["الشيخ", "فلان"] → ["الشيخ فلان"]. A trailing fragment is kept as is. */
export function mergeBareTitles(names: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < names.length; i++) {
    const current = names[i] as string;
    const next = names[i + 1];
    if (isBareTitle(current) && next !== undefined && !isBareTitle(next)) {
      out.push(`${current.trim()} ${next.trim()}`);
      i++;
    } else out.push(current);
  }
  return out;
}
