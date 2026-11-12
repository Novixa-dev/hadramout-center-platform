/** The first letter of a name, skipping marks and symbols a name may start with (a name like «!test» showed «!»). */
export const initialOf = (s: string): string => s.match(/\p{L}/u)?.[0]?.toLocaleUpperCase() ?? '';
