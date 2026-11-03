import {Link, redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/account.orders.$id';
import {Money, Image} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {requireCustomerAccessToken} from '~/lib/customerAuth.server';
import {useShowcaseCart} from '~/context/ShowcaseCartContext';
import {useAddToCartFeedback} from '~/hooks/useAddToCartFeedback';
import type {ShowcaseProduct} from '~/data/showcaseProducts';
import {
  PRODUCTS_BY_ID_QUERY,
  mapProductsByIds,
  type ProductsByIdQueryResult,
} from '~/lib/showcaseCommerce';

type Money2 = Pick<MoneyV2, 'amount' | 'currencyCode'>;

interface OrderLineItem {
  title: string;
  quantity: number;
  originalTotalPrice: Money2;
  discountedTotalPrice: Money2;
  customAttributes: {key: string; value: string}[];
  variant: {
    id: string;
    title: string;
    image: {id: string; url: string; altText: string | null; width: number; height: number} | null;
    price: Money2;
    product: {id: string; handle: string};
  } | null;
}

interface OrderDetail {
  id: string;
  name: string;
  processedAt: string;
  fulfillmentStatus: string | null;
  statusUrl: string;
  subtotalPrice: Money2 | null;
  totalTax: Money2 | null;
  totalPrice: Money2 | null;
  shippingAddress: {name: string | null; formatted: string[]; formattedArea: string | null} | null;
  discountApplications: {
    nodes: {
      value:
        | ({__typename: 'MoneyV2'} & Money2)
        | {__typename: 'PricingPercentageValue'; percentage: number};
    }[];
  };
  lineItems: {nodes: OrderLineItem[]};
}

export const meta: Route.MetaFunction = ({data}) => {
  const order = (data as {order?: OrderDetail} | undefined)?.order;
  return [{title: order ? `Order ${order.name} | Urban Essentials` : 'Order | Urban Essentials'}];
};

// The order's own GID (base64-decoded from the /account/orders link) is a
// real `gid://shopify/Order/...` — the Storefront API's generic `node`
// query resolves any GID directly, which is simpler than searching orders
// by id and matches what the Customer Account API version of this page did.
const ACCOUNT_ORDER_QUERY = `#graphql
  query AccountOrder($orderId: ID!) {
    node(id: $orderId) {
      ... on Order {
        id
        name
        processedAt
        fulfillmentStatus
        statusUrl
        subtotalPrice {
          amount
          currencyCode
        }
        totalTax {
          amount
          currencyCode
        }
        totalPrice {
          amount
          currencyCode
        }
        shippingAddress {
          name
          formatted(withName: true)
          formattedArea
        }
        discountApplications(first: 10) {
          nodes {
            value {
              __typename
              ... on MoneyV2 {
                amount
                currencyCode
              }
              ... on PricingPercentageValue {
                percentage
              }
            }
          }
        }
        lineItems(first: 100) {
          nodes {
            title
            quantity
            originalTotalPrice {
              amount
              currencyCode
            }
            discountedTotalPrice {
              amount
              currencyCode
            }
            customAttributes {
              key
              value
            }
            variant {
              id
              title
              image {
                id
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
              product {
                id
                handle
              }
            }
          }
        }
      }
    }
  }
` as const;

export async function loader({params, request, context}: Route.LoaderArgs) {
  // The order page doesn't need the token itself (Order lookup by GID isn't
  // scoped to a customer the way `customer.orders` is) — this just makes
  // sure a signed-out visitor can't view someone's order by guessing/
  // sharing this URL.
  requireCustomerAccessToken(context.session, request);

  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);

  const result = await context.storefront.query(ACCOUNT_ORDER_QUERY, {
    variables: {orderId},
  });

  if (result.errors?.length || !result.node) {
    throw new Error('Order not found');
  }

  const order = result.node as unknown as OrderDetail;
  const lineItems = order.lineItems.nodes;
  const discountApplications = order.discountApplications.nodes;
  const firstDiscount = discountApplications[0]?.value;
  const discountValue = firstDiscount?.__typename === 'MoneyV2' ? firstDiscount : null;
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue' ? firstDiscount.percentage : null;

  // Resolve each line item's product against the LIVE catalog (current
  // price/stock/customization) rather than trusting anything from when the
  // order was placed — powers the "Order Again" buttons below.
  const productIds = [
    ...new Set(lineItems.map((li) => li.variant?.product.id).filter((id): id is string => !!id)),
  ];
  let productsById: Record<string, ShowcaseProduct> = {};
  if (productIds.length > 0) {
    const result = await context.storefront
      .query<ProductsByIdQueryResult>(PRODUCTS_BY_ID_QUERY, {
        variables: {ids: productIds},
        cache: context.storefront.CacheShort(),
      })
      .catch((error: Error) => {
        console.warn('Order reorder-product lookup fallback:', error?.message);
        return null;
      });
    productsById = Object.fromEntries(mapProductsByIds(result));
  }

  return {order, lineItems, discountValue, discountPercentage, productsById};
}

export default function OrderRoute() {
  const {order, lineItems, discountValue, discountPercentage, productsById} =
    useLoaderData<typeof loader>();

  return (
    <div className="max-w-3xl">
      <Link
        to="/account/orders"
        prefetch="intent"
        className="text-xs uppercase tracking-widest text-[#6d6560] hover:text-[#241a16] transition-colors"
      >
        ← Back to orders
      </Link>
      <h2 className="text-2xl font-serif font-light text-[#241a16] mt-3 mb-1">Order {order.name}</h2>
      <p className="text-xs text-[#6d6560] mb-6">Placed on {new Date(order.processedAt).toDateString()}</p>

      <div className="bg-white rounded-2xl border border-[#c9c2b8] divide-y divide-[#e8e2d6]">
        {lineItems.map((lineItem, lineItemIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <OrderLineRow
            key={lineItemIndex}
            lineItem={lineItem}
            product={lineItem.variant ? productsById[lineItem.variant.product.id] : undefined}
          />
        ))}
        <div className="p-6 space-y-2 text-sm">
          {((discountValue && discountValue.amount) || discountPercentage) && (
            <div className="flex justify-between text-[#6d6560]">
              <span>Discounts</span>
              {discountPercentage ? (
                <span className="font-serif">-{discountPercentage}% OFF</span>
              ) : (
                discountValue && <span className="font-serif"><Money data={discountValue} /></span>
              )}
            </div>
          )}
          {order.subtotalPrice && (
            <div className="flex justify-between text-[#6d6560]">
              <span>Subtotal</span>
              <span className="font-serif"><Money data={order.subtotalPrice} /></span>
            </div>
          )}
          {order.totalTax && (
            <div className="flex justify-between text-[#6d6560]">
              <span>Tax</span>
              <span className="font-serif"><Money data={order.totalTax} /></span>
            </div>
          )}
          {order.totalPrice && (
            <div className="flex justify-between text-[#241a16] font-semibold pt-2 border-t border-[#e8e2d6]">
              <span>Total</span>
              <span className="font-serif"><Money data={order.totalPrice} /></span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-2xl border border-[#c9c2b8] p-6">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold mb-2">
            Shipping address
          </h3>
          {order?.shippingAddress ? (
            <address className="not-italic text-sm text-[#241a16] leading-relaxed">
              <p>{order.shippingAddress.name}</p>
              {order.shippingAddress.formatted?.map((line) => <p key={line}>{line}</p>)}
              {order.shippingAddress.formattedArea && <p>{order.shippingAddress.formattedArea}</p>}
            </address>
          ) : (
            <p className="text-sm text-[#6d6560]">No shipping address defined</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-[#c9c2b8] p-6">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold mb-2">Status</h3>
          <p className="text-sm text-[#241a16]">{order.fulfillmentStatus ?? 'N/A'}</p>
        </div>
      </div>

      <a
        target="_blank"
        href={order.statusUrl}
        rel="noreferrer"
        className="inline-block mt-6 px-6 py-2.5 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200"
      >
        View order status →
      </a>
      {order.fulfillmentStatus && order.fulfillmentStatus !== 'UNFULFILLED' && (
        <Link
          to={`/returns?order=${encodeURIComponent(order.name)}`}
          className="inline-block mt-6 ml-3 px-6 py-2.5 rounded-full border border-[#241a16] text-[#241a16] hover:bg-[#241a16] hover:text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200"
        >
          Request a return
        </Link>
      )}
    </div>
  );
}

function OrderLineRow({lineItem, product}: {lineItem: OrderLineItem; product?: ShowcaseProduct}) {
  const personalization = lineItem.customAttributes?.find((a) => a.key === 'Customization')?.value;
  const discountAmount =
    parseFloat(lineItem.originalTotalPrice.amount) - parseFloat(lineItem.discountedTotalPrice.amount);

  return (
    <div className="flex items-center gap-4 p-6">
      {lineItem.variant?.image && (
        <Image
          data={lineItem.variant.image}
          width={72}
          height={72}
          className="rounded-lg border border-[#e8e2d6] object-cover w-[72px] h-[72px]"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#241a16] truncate">{lineItem.title}</p>
        <p className="text-xs text-[#6d6560]">{lineItem.variant?.title}</p>
        {personalization && (
          <p className="text-xs text-[#6d6560] mt-0.5">
            Customized by <span className="text-[#241a16]">&ldquo;{personalization}&rdquo;</span>
          </p>
        )}
      </div>
      <div className="text-right text-base font-serif font-semibold text-[#241a16] shrink-0">
        <p>
          <Money data={lineItem.originalTotalPrice} />
          {lineItem.quantity > 1 ? ` × ${lineItem.quantity}` : ''}
        </p>
        {discountAmount > 0 && (
          <p className="text-xs text-[#6d6560]">
            -<Money data={{amount: String(discountAmount), currencyCode: lineItem.originalTotalPrice.currencyCode}} /> off
          </p>
        )}
        {product && lineItem.variant && (
          <div className="mt-2">
            <ReorderButton
              product={product}
              variantId={lineItem.variant.id}
              quantity={lineItem.quantity}
              customName={personalization}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ReorderButton({
  product,
  variantId,
  quantity,
  customName,
}: {
  product: ShowcaseProduct;
  variantId: string;
  quantity: number;
  customName?: string;
}) {
  const {addItem} = useShowcaseCart();
  const variant = product.variants.find((v) => v.id === variantId);
  const {state, trigger} = useAddToCartFeedback(
    () => addItem(product, variantId, quantity, customName),
    {addedDurationMs: 2000},
  );
  const isAdded = state === 'added';

  if (!variant) {
    return (
      <Link
        to={`/products/${product.handle}`}
        prefetch="intent"
        className="text-xs uppercase tracking-widest text-[#6d6560] hover:text-[#241a16] font-medium transition-colors"
      >
        View Product →
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={trigger}
      disabled={!variant.inStock || state !== 'idle'}
      className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        isAdded ? 'bg-emerald-600 text-white' : 'bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8]'
      }`}
    >
      {isAdded ? 'Added to Cart' : variant.inStock ? 'Order Again' : 'Currently Unavailable'}
    </button>
  );
}
