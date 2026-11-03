import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {Analytics, useNonce} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductDiscoveryGrid} from '~/components/visual/Shop/ProductDiscoveryGrid';
import {ShopPageHeader} from '~/components/visual/Shop/ShopPageHeader';
import {mapShowcaseCatalog, type ShowcaseCatalogQueryResult} from '~/lib/showcaseCommerce';

export const meta: Route.MetaFunction = ({data}) => {
  const description =
    data?.collection.description?.slice(0, 155) ||
    `Shop the ${data?.collection.title ?? ''} collection at Urban Essentials.`;
  return [
    {title: `${data?.collection.title ?? ''} | Urban Essentials`},
    {name: 'description', content: description},
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw redirect('/collections');
  }

  const {collection, customizationFeeProduct} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, first: 100},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {collection, customizationFeeProduct, origin: new URL(request.url).origin};
}

export default function Collection() {
  const {collection, customizationFeeProduct, origin} = useLoaderData<typeof loader>();
  // mapShowcaseCatalog falls back to the whole bundled catalog when it gets no
  // products — right for the shop page, wrong for a category that is simply
  // empty (it would list unrelated products under, say, "Whiskey Glasses").
  const catalog = collection.products.nodes.length
    ? mapShowcaseCatalog({
        products: collection.products,
        customizationFeeProduct,
      } as ShowcaseCatalogQueryResult)
    : [];
  const nonce = useNonce();

  return (
    <div className="urbanessentials-showcase bg-white">
      <ShopPageHeader
        title={collection.title}
        bannerImage={collection.image}
        breadcrumbs={[
          {label: 'Home', to: '/'},
          {label: 'Collections', to: '/collections'},
          {label: collection.title},
        ]}
      />
      <ProductDiscoveryGrid products={catalog} showHeading={false} sidebar />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {'@type': 'ListItem', position: 1, name: 'Home', item: origin},
              {'@type': 'ListItem', position: 2, name: 'Collections', item: `${origin}/collections`},
              {
                '@type': 'ListItem',
                position: 3,
                name: collection.title,
                item: `${origin}/collections/${collection.handle}`,
              },
            ],
          }),
        }}
      />
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
      }
      products(first: $first, sortKey: BEST_SELLING) {
        nodes {
          id
          handle
          title
          descriptionHtml
          tags
          productType
          featuredImage {
            url
            altText
          }
          options {
            name
            values
          }
          variants(first: 20) {
            nodes {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              image {
                url
                altText
              }
            }
          }
          metafields(identifiers: [
            {namespace: "custom", key: "enable_customization"}
            {namespace: "custom", key: "customization_fee"}
            {namespace: "custom", key: "customization_shipping_days"}
          ]) {
            key
            value
          }
        }
      }
    }
    # Same "Customization Fee" billing product referenced by
    # SHOWCASE_CATALOG_QUERY (see showcaseCommerce.ts) — needed here too so
    # a product personalized from a collection/category page resolves the
    # same real, correctly-priced fee variant at checkout.
    customizationFeeProduct: product(handle: "customization-fee") {
      variants(first: 50) {
        nodes {
          id
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;
