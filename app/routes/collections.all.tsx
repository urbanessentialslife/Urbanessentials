import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {ProductDiscoveryGrid} from '~/components/visual/Shop/ProductDiscoveryGrid';
import {ShopPageHeader} from '~/components/visual/Shop/ShopPageHeader';
import {
  SHOWCASE_CATALOG_QUERY,
  mapShowcaseCatalog,
  type ShowcaseCatalogQueryResult,
} from '~/lib/showcaseCommerce';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Shop | UrbanEssentials'},
    {
      name: 'description',
      content: 'The full UrbanEssentials catalog — architectural tumblers and curated gifts.',
    },
  ];
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
