/**
 * An amount with its currency for people to read. Other languages get the currency's name with the right plural («15 US dollars»).
 * Arabic gets the usual abbreviation (‏15,000 ر.ي.‏): Intl writes the name unchanged after any number («15 دولار أمريكي»), which
 * breaks Arabic number–noun agreement, and the abbreviation is what shops and receipts in Yemen use. Digits stay Latin, as on the
 * rest of the site.
 */
export function formatMoney(amount: number, currency: string, lang: string): string {
  const arabic = lang === 'ar';
  try {
    return new Intl.NumberFormat(`${lang}-u-nu-latn`, {
      style: 'currency',
      currency,
      currencyDisplay: arabic ? 'symbol' : 'name',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // an unknown language tag or currency code: the plain number and the code still say it
    return `${new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(amount)} ${currency}`;
  }
}
