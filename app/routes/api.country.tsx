import {redirect} from 'react-router';
import type {Route} from './+types/api.country';
import {COUNTRY_SESSION_KEY, isCountryCode} from '~/lib/i18n';

/**
 * Stores the visitor's chosen buyer country (from the footer selector) in
 * the session, then sends them back to the page they were on. The next
 * request's Hydrogen context picks it up — see app/lib/context.ts.
 */
export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const country = String(formData.get('country') || '').toUpperCase();
  const redirectTo = String(formData.get('redirectTo') || '/');
  // Only same-site relative paths — never an open redirect.
  const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';

  if (!isCountryCode(country)) {
    return redirect(safeRedirect);
  }

  // Only accept countries the shop actually sells to.
  const result = await context.storefront
    .query(AVAILABLE_COUNTRIES_QUERY, {cache: context.storefront.CacheLong()})
    .catch(() => null);
  const available = result?.localization.availableCountries.map((c) => c.isoCode) ?? [];
  if (available.includes(country)) {
    context.session.set(COUNTRY_SESSION_KEY, country);
  }

  return redirect(safeRedirect);
}

export async function loader() {
  return redirect('/');
}

const AVAILABLE_COUNTRIES_QUERY = `#graphql
  query AvailableCountries {
    localization {
      availableCountries {
        isoCode
      }
    }
  }
` as const;
