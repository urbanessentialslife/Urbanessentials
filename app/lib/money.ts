/**
 * Formats a bare amount for display after a currency symbol. Rupee prices
 * keep Indian digit grouping (1,00,000); every other currency uses
 * international grouping (100,000). Whole amounts drop the decimals; others
 * show two (e.g. $12.50).
 */
export function formatAmount(value: number, currencySymbol = '₹'): string {
  const locale = currencySymbol === '₹' ? 'en-IN' : 'en-US';
  const whole = Number.isInteger(value);
  return value.toLocaleString(locale, {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Narrow symbol for an ISO currency code (INR → ₹, USD → $, AED → AED). */
export function currencySymbolFor(currencyCode: string): string {
  try {
    const part = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((p) => p.type === 'currency');
    return part?.value ?? currencyCode;
  } catch {
    return currencyCode;
  }
}
