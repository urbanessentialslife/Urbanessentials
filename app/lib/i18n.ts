import type {CountryCode} from '@shopify/hydrogen/storefront-api-types';

/**
 * The shop's primary market. Visitors see this country's prices until they
 * pick another one from the footer's country selector — which only appears
 * once more than one country is enabled under Shopify Admin → Settings →
 * Markets (see docs/international-markets.md).
 */
export const DEFAULT_COUNTRY: CountryCode = 'IN';

/** Session key holding the visitor's chosen buyer country. */
export const COUNTRY_SESSION_KEY = 'buyerCountry';

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && /^[A-Z]{2}$/.test(value);
}
