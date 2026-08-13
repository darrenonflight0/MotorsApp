export function numberWithCommas(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

// Platform display currency, driven by the same value the Paystack checkout uses
// so what a user sees always matches what they're charged.
const CURRENCY = (process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY ?? 'GHS').toUpperCase();

const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: '₵', NGN: '₦', ZAR: 'R', KES: 'KSh', USD: '$', GBP: '£', EUR: '€',
};

export const currencyCode = CURRENCY;
export const currencySymbol = CURRENCY_SYMBOLS[CURRENCY] ?? `${CURRENCY} `;

/** Format an amount in the platform currency, e.g. "₵20" or "GHS 20". */
export function money(amount: number): string {
  return `${currencySymbol}${numberWithCommas(amount)}`;
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
