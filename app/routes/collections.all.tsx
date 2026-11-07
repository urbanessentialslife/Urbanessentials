import type {Route} from './+types/collections.all';
import {buildMeta} from '~/lib/seo';
import {useLoaderData} from 'react-router';
import {ProductDiscoveryGrid} from '~/components/visual/Shop/ProductDiscoveryGrid';
import {ShopPageHeader} from '~/components/visual/Shop/ShopPageHeader';
import {
  SHOWCASE_CATALOG_QUERY,
  mapShowcaseCatalog,
  type ShowcaseCatalogQueryResult,
} from '~/lib/showcaseCommerce';

export const meta: Route.MetaFunction = ({matches, location}) => {
  return buildMeta({
    matches,
    location,
    title: 'Shop All – Premium Tumblers, Water Bottles & Gifts',
    description:
      'Shop the full Urban Essentials range: insulated tumblers, Stanley cups, water bottles, coffee mugs, crockery, home décor and luxury gift sets. Free delivery across India.',
  });
};

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const result = await storefront
    .query<ShowcaseCatalogQueryResult>(SHOWCASE_CATALOG_QUERY, {
      variables: {first: 100},
      cache: storefront.CacheShort(),
    })
    .catch((error: Error) => {
      console.warn('Collection catalog query fallback:', error?.message);
      return null;
    });

  return {catalog: mapShowcaseCatalog(result)};
}

export default function CollectionAll() {
  const {catalog} = useLoaderData<typeof loader>();

  return (
    <div className="urbanessentials-showcase bg-white">
      <ShopPageHeader
        title="Shop"
        breadcrumbs={[{label: 'Home', to: '/'}, {label: 'Shop'}]}
      />
      <ProductDiscoveryGrid products={catalog} showHeading={false} sidebar />
    </div>
  );
}
