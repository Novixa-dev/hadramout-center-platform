/**
 * Year labels for the historical timeline. A bare number is ambiguous («800 ق.م – 300» reads as two different eras
 * without units), so a range that crosses from BCE to CE always names both ends' era.
 */
export interface YearLabels {
  /** "{n} BCE" (e.g. "{n} ق.م") */
  bce: (n: number) => string;
  /** "{n} CE" (e.g. "{n} م") */
  ce: (n: number) => string;
}

export function yearLabel(year: number, labels: YearLabels): string {
  return year < 0 ? labels.bce(Math.abs(year)) : String(year);
}

export function yearRange(from: number, to: number | null | undefined, labels: YearLabels): string {
  if (to === null || to === undefined || to === from) return yearLabel(from, labels);
  // crossing eras: both ends carry their unit; otherwise one unit at the end is enough ("800 – 300 ق.م")
  if (from < 0 && to > 0) return `${labels.bce(Math.abs(from))} – ${labels.ce(to)}`;
  if (from < 0 && to < 0) {
    const [a, b] = [Math.abs(from), Math.abs(to)];
    return `${a} – ${labels.bce(b)}`;
  }
  return `${from} – ${to}`;
}

/** Ordering key: BCE ranges first, then by start year, then by end year. */
export const byYear = (a: { yearFrom: number; yearTo?: number | null }, b: { yearFrom: number; yearTo?: number | null }): number => a.yearFrom - b.yearFrom || (a.yearTo ?? a.yearFrom) - (b.yearTo ?? b.yearFrom);
