import { useEffect } from 'react';
import {buildMeta} from '~/lib/seo';
import { useLoaderData, useRouteLoaderData } from 'react-router';
import type { Route } from './+types/_index';
import { ShowroomGate } from '~/components/visual/Showroom/ShowroomGate';
import { ProductCinematicScroll } from '~/components/visual/Showroom/ProductCinematicScroll';
import { FeaturedCollections } from '~/components/visual/Shop/FeaturedCollections';
import { TopSellers } from '~/components/visual/Shop/TopSellers';
import { ProductDiscoveryGrid } from '~/components/visual/Shop/ProductDiscoveryGrid';
import {
  PRODUCT_BY_HANDLE_QUERY,
  SHOWCASE_CATALOG_QUERY,
  TOP_SELLERS_QUERY,
  findByHandle,
  mapProductNode,
  mapShowcaseCatalog,
  type ProductByHandleQueryResult,
  type ShowcaseCatalogQueryResult,
} from '~/lib/showcaseCommerce';

// The product the homepage's scroll-scrubbed frame sequence was shot for
// (see ProductCinematicScroll / public/frames/coffee-cup-*).
const CINEMATIC_PRODUCT_HANDLE = 'the-coffee-cup';

export const meta: Route.MetaFunction = ({matches, location}) => {
  return buildMeta({
    matches,
    location,
    title: 'Urban Essentials | Premium Tumblers, Water Bottles & Luxury Gifts',
    exactTitle: true,
    description:
      'Shop premium insulated tumblers, Stanley cups, water bottles, coffee mugs, home décor and luxury gift sets at Urban Essentials. Thoughtful gifts, free delivery across India.',
  });
};

export async function loader({ context }: Route.LoaderArgs) {
  const { storefront } = context;

  const [catalogResult, topSellersResult, cinematicResult] = await Promise.all([
    // Homepage only ever teases 8 cards here ("Browse More" covers the
    // rest on /collections/all) — fetching the full 50-product catalog on
    // every homepage view was pure waste that only grows with the catalog.
    storefront
      .query<ShowcaseCatalogQueryResult>(SHOWCASE_CATALOG_QUERY, {
        // Top Sellers picks its pinned products out of this list by handle,
        // so it must cover the whole catalog (the store already has 64+).
        variables: { first: 100 },
        cache: storefront.CacheShort(),
      })
      .catch((error: Error) => {
        console.warn('Showcase catalog query fallback:', error?.message);
        return null;
      }),
    storefront
      .query<ShowcaseCatalogQueryResult>(TOP_SELLERS_QUERY, {
        variables: { first: 8 },
        cache: storefront.CacheShort(),
      })
      .catch((error: Error) => {
        console.warn('Top sellers query fallback:', error?.message);
        return null;
      }),
    // Fetched by handle rather than picked out of the 12-product teaser
    // above — on the live store it sorts outside those 12, so the whole
    // cinematic section silently rendered nothing.
    storefront
      .query<ProductByHandleQueryResult>(PRODUCT_BY_HANDLE_QUERY, {
        variables: { handle: CINEMATIC_PRODUCT_HANDLE },
        cache: storefront.CacheShort(),
      })
      .catch((error: Error) => {
        console.warn('Cinematic product query fallback:', error?.message);
        return null;
      }),
  ]);

  const catalog = mapShowcaseCatalog(catalogResult);
  const topSellers = mapShowcaseCatalog(topSellersResult);

  const cinematicProduct = cinematicResult?.product
    ? mapProductNode(
        cinematicResult.product,
        0,
        cinematicResult.customizationFeeProduct?.variants.nodes ?? [],
      )
    : (findByHandle(catalog, CINEMATIC_PRODUCT_HANDLE) ?? null);

  return { catalog, topSellers, cinematicProduct };
}

export default function Homepage() {
  const { catalog, topSellers, cinematicProduct } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<{
    categories?: { handle: string; title: string; image?: { url: string } | null }[];
  }>('root');

  // Arriving here via a `/#section` link from another page (e.g. the footer
  // or header nav) — jump to that section once the page has settled.
  useEffect(() => {
    const id = window.location.hash?.slice(1);
    if (!id) return;
    const timeout = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {/* The homepage hero is purely visual (a scroll-driven showroom), so
          give search engines and screen readers the page's main heading. */}
      <h1 className="sr-only">
        Urban Essentials – Premium Tumblers, Water Bottles, Mugs, Home Décor &amp; Luxury Gift Sets
      </h1>
      <ShowroomGate />
      {/* The light shop sheet rises over the entrance showroom */}
      <div
        id="shop"
        className="relative z-10 -mt-10 rounded-t-[2.5rem] overflow-hidden bg-white shadow-[0_-30px_60px_rgba(0,0,0,0.35)]"
      >
        {/* Top Sellers right after scrolling main page */}
        <TopSellers products={catalog.length ? catalog : topSellers} limit={6} />
        {/* Curated Collections Spotlight */}
        <FeaturedCollections categories={rootData?.categories} />
        <ProductDiscoveryGrid
          products={catalog}
          limit={8}
          browseMoreHref="/collections/all"
          showColorFilter={false}
        />
      </div>
      {/* The tumbler walk-around plays as a cinematic finale right above the footer */}
      <ProductCinematicScroll product={cinematicProduct} />
    </>
  );
}
