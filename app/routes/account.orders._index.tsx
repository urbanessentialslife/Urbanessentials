import {Link, useLoaderData, useNavigation, useSearchParams} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {useRef} from 'react';
import {Money, getPaginationVariables} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {requireCustomerAccessToken} from '~/lib/customerAuth.server';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

interface OrderSummary {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: Pick<MoneyV2, 'amount' | 'currencyCode'>;
}

type OrdersLoaderData = {
  orders: {nodes: OrderSummary[]; pageInfo: any};
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Orders | Urban Essentials'}];
};

const CUSTOMER_ORDERS_QUERY = `#graphql
  query AccountOrders(
    $customerAccessToken: String!
    $endCursor: String
    $first: Int
    $last: Int
    $startCursor: String
    $query: String
  ) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        query: $query,
        sortKey: PROCESSED_AT,
        reverse: true
      ) {
        nodes {
          id
          name
          orderNumber
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice {
            amount
            currencyCode
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
` as const;

export async function loader({request, context}: Route.LoaderArgs) {
  const token = requireCustomerAccessToken(context.session, request);
  const paginationVariables = getPaginationVariables(request, {pageBy: 20});

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const result = await context.storefront.query(CUSTOMER_ORDERS_QUERY, {
    variables: {...paginationVariables, query, customerAccessToken: token},
  });

  if (result.errors?.length || !result.customer) {
    throw new Error('Customer orders not found');
  }

  return {orders: result.customer.orders, filters};
}

export default function Orders() {
  const {orders, filters} = useLoaderData<OrdersLoaderData>();

  return (
    <div className="max-w-3xl space-y-6">
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: OrdersLoaderData['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!filters.name;

  return (
    <div aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders} resourcesClassName="space-y-4">
          {({node: order}: {node: OrderSummary}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return (
    <div className="bg-white rounded-2xl border border-[#c9c2b8] p-8 text-center">
      {hasFilters ? (
        <>
          <p className="text-sm text-[#6d6560] mb-3">No orders found matching your search.</p>
          <Link to="/account/orders" prefetch="intent" className="text-xs uppercase tracking-widest text-[#241a16] hover:text-[#a69686] font-medium">
            Clear filters →
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-[#6d6560] mb-3">You haven&apos;t placed any orders yet.</p>
          <Link to="/collections/all" prefetch="intent" className="text-xs uppercase tracking-widest text-[#241a16] hover:text-[#a69686] font-medium">
            Start shopping →
          </Link>
        </>
      )}
    </div>
  );
}

function OrderSearchForm({currentFilters}: {currentFilters: OrderFilterParams}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching = navigation.state !== 'idle' && navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name;
  const searchInputClass =
    'rounded-lg border border-[#c9c2b8] bg-white px-4 py-2.5 text-sm text-[#241a16] placeholder:text-[#6d6560] focus:outline-none focus:ring-2 focus:ring-[#241a16]/20 focus:border-[#241a16]';

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#c9c2b8] p-6" aria-label="Search orders">
      <fieldset className="flex flex-wrap items-end gap-3">
        <legend className="text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold mb-2 w-full">
          Filter orders
        </legend>

        <input
          type="search"
          name={ORDER_FILTER_FIELDS.NAME}
          placeholder="Order #"
          aria-label="Order number"
          defaultValue={currentFilters.name || ''}
          className={searchInputClass}
        />

        <div className="flex gap-3">
          <button type="submit" disabled={isSearching} className="px-6 py-2.5 rounded-full bg-[#241a16] hover:bg-[#3a2c24] disabled:opacity-60 text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200">
            {isSearching ? 'Searching…' : 'Search'}
          </button>
          {hasFilters && (
            <button
              type="button"
              disabled={isSearching}
              onClick={() => {
                setSearchParams(new URLSearchParams());
                formRef.current?.reset();
              }}
              className="px-6 py-2.5 rounded-full border border-[#c9c2b8] hover:border-[#241a16] disabled:opacity-60 text-[#6d6560] hover:text-[#241a16] text-xs uppercase tracking-widest font-medium transition-all duration-200"
            >
              Clear
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}

function OrderItem({order}: {order: OrderSummary}) {
  return (
    <Link
      to={`/account/orders/${btoa(order.id)}`}
      prefetch="intent"
      className="block bg-white rounded-2xl border border-[#c9c2b8] hover:border-[#b89b6a] p-6 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[#241a16]">Order <span className="font-serif">{order.name}</span></span>
        <span className="text-xs uppercase tracking-widest text-[#6d6560]">
          {order.financialStatus}
          {order.fulfillmentStatus ? ` · ${order.fulfillmentStatus}` : ''}
        </span>
      </div>
      <p className="text-xs text-[#6d6560] mt-1">{new Date(order.processedAt).toDateString()}</p>
      <div className="flex items-center justify-between mt-4">
        <Money data={order.totalPrice} className="text-base font-serif font-semibold text-[#241a16]" />
        <span className="text-xs uppercase tracking-widest text-[#241a16] font-medium">View & Reorder →</span>
      </div>
    </Link>
  );
}
