import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap} from '@shopify/hydrogen';
import {INTERNAL_PRODUCT_HANDLES} from '~/lib/showcaseCommerce';

// The "Customization Fee" product (see app/lib/showcaseCommerce.ts) is a
// real Shopify product used only as an internal billing SKU — it must never
// be indexed as a shoppable page. getSitemap() has no per-handle exclusion
// option, so it's stripped out of the generated XML here instead. Sourced
// from the same INTERNAL_PRODUCT_HANDLES as the catalog and search filters
// (see app/lib/search.ts) so there's exactly one list to update if this
// product's handle ever changes.
const EXCLUDED_SITEMAP_HANDLES = [...INTERNAL_PRODUCT_HANDLES];

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    locales: ['EN-US', 'EN-CA', 'FR-CA'],
    getLink: ({type, baseUrl, handle, locale}) => {
      if (!locale) return `${baseUrl}/${type}/${handle}`;
      return `${baseUrl}/${locale}/${type}/${handle}`;
    },
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  if (params.type !== 'products') {
    return response;
  }

  const xml = await response.text();
  const filtered = xml
    .split(/(?=<url>)/)
    .filter(
      (block) =>
        !EXCLUDED_SITEMAP_HANDLES.some((handle) => block.includes(`/products/${handle}`)),
    )
    .join('');

  return new Response(filtered, {
    status: response.status,
    headers: response.headers,
  });
}
