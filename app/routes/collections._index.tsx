import {tileImageFor} from '~/lib/navMenus';
import {buildMeta} from '~/lib/seo';
import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ShopPageHeader} from '~/components/visual/Shop/ShopPageHeader';

export const meta: Route.MetaFunction = ({matches, location}) => {
  return buildMeta({
    matches,
    location,
    title: 'Shop by Collection – Tumblers, Bottles, Mugs & Gifts',
    description:
      'Browse every Urban Essentials collection: Stanley tumblers, insulated water bottles, kids bottles, mugs, crockery, home décor and curated gift sets. Free delivery across India.',
  });
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  // Shopify auto-creates a "frontpage" collection for every store (legacy
  // homepage-sections convention); it's not a real shopper-facing category
  // and shows up here as a confusing "Home page" card if left in.
  collections.nodes = collections.nodes.filter(
    (collection) => collection.handle !== 'frontpage',
  );

  return {collections};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pb-24 font-sans">
      <ShopPageHeader
        title="Collections"
        breadcrumbs={[{label: 'Home', to: '/'}, {label: 'Collections'}]}
      />
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <PaginatedResourceSection<CollectionFragment>
          connection={collections}
          resourcesClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {({node: collection, index}) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              index={index}
            />
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  const fallbackImage = tileImageFor(`/collections/${collection.handle}`);
  return (
    <Link
      className="group flex flex-col rounded-3xl bg-white border border-[#c9c2b8] overflow-hidden shadow-[0_4px_16px_rgba(40,30,20,0.04)] hover:shadow-[0_14px_32px_rgba(40,30,20,0.1)] transition-shadow duration-300"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {collection?.image ? (
        <div className="aspect-square overflow-hidden bg-[#e8e1d4]">
          <Image
            alt={collection.image.altText || collection.title}
            aspectRatio="1/1"
            data={collection.image}
            loading={index < 3 ? 'eager' : undefined}
            sizes="(min-width: 45em) 400px, 100vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : fallbackImage ? (
        // Stand-in photo until a collection image is set in Shopify Admin.
        <div className="aspect-square overflow-hidden bg-[#e8e1d4]">
          <img
            src={fallbackImage}
            alt={collection.title}
            loading={index < 3 ? 'eager' : 'lazy'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : null}
      <h5 className="p-5 text-base font-medium text-[#241a16] tracking-tight">
        {collection.title}
      </h5>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
