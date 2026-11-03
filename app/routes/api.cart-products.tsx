import type {Route} from './+types/api.cart-products';
import {
  PRODUCTS_BY_ID_QUERY,
  mapProductsByIds,
  type ProductsByIdQueryResult,
} from '~/lib/showcaseCommerce';

/**
 * Live product data for the IDs in a visitor's locally-stored cart, in the
 * visitor's current market. ShowcaseCartContext uses it to re-price saved
 * items after a country/currency switch or an admin price edit.
 */
export async function loader({request, context}: Route.LoaderArgs) {
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .filter((id) => id.startsWith('gid://shopify/Product/'))
    .slice(0, 50);

  if (ids.length === 0) return {products: {}};

  const result = await context.storefront
    .query<ProductsByIdQueryResult>(PRODUCTS_BY_ID_QUERY, {
      variables: {ids},
      cache: context.storefront.CacheShort(),
    })
    .catch((error: Error) => {
      console.warn('Cart product refresh failed:', error?.message);
      return null;
    });

  return {products: Object.fromEntries(mapProductsByIds(result))};
}
