import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {COUNTRY_SESSION_KEY, DEFAULT_COUNTRY, isCountryCode} from '~/lib/i18n';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

// Define the additional context object
const additionalContext = {
  // Additional context for custom properties, CMS clients, 3P SDKs, etc.
  // These will be available as both context.propertyName and context.get(propertyContext)
  // Example of complex objects that could be added:
  // cms: await createCMSClient(env),
  // reviews: await createReviewsClient(env),
} as const;

// Automatically augment HydrogenAdditionalContext with the additional context type
type AdditionalContextType = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}

  // Augment HydrogenCustomCartFragment with the codegen'd cart fragment type so
  // that context.cart.get() and all cart mutations return the extended cart type.
  interface HydrogenCustomCartFragment extends CartApiQueryFragment {}
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  // The Workers Cache API (`caches`) isn't available on every platform this
  // app deploys to (e.g. Vercel Functions) — sub-request caching is optional
  // in HydrogenContextOptions, so just skip it where there's no `caches` global.
  const [cache, session] = await Promise.all([
    typeof caches === 'undefined' ? undefined : caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const storedCountry: unknown = session.get(COUNTRY_SESSION_KEY);
  const buyerCountry = isCountryCode(storedCountry) ? storedCountry : DEFAULT_COUNTRY;

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      // Buyer country comes from the visitor's choice in the footer country
      // selector (stored in the session), defaulting to the primary market.
      // Every catalog/cart query carries @inContext(country:), so prices and
      // currency follow whatever Shopify Markets resolves for that country.
      i18n: {language: 'EN', country: buyerCountry},
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    additionalContext,
  );

  return hydrogenContext;
}
