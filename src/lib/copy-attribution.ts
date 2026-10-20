/** Selections shorter than this are copied untouched (a word, a name, a date). */
export const MIN_ATTRIBUTION_CHARS = 40;

export const needsAttribution = (selected: string): boolean => selected.trim().length >= MIN_ATTRIBUTION_CHARS;

/** Plain-text clipboard payload: the passage, a blank line, then the source line (title, site, address). */
export const withAttribution = (selected: string, line: string): string => `${selected.trim()}\n\n${line}`;
