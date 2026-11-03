import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {
  ACCOUNT_CUSTOMER_FRAGMENT,
  clearCustomerSession,
  requireCustomerAccessToken,
} from '~/lib/customerAuth.server';

export function shouldRevalidate() {
  return true;
}

const ACCOUNT_SHELL_QUERY = `#graphql
  query AccountShell($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      ...AccountCustomer
    }
  }
  ${ACCOUNT_CUSTOMER_FRAGMENT}
` as const;

export async function loader({context, request}: Route.LoaderArgs) {
  // Redirects to /account/login (preserving this path to return to) when
  // there's no live session — every /account/* page shares this guard.
  const token = requireCustomerAccessToken(context.session, request);

  const result = await context.storefront.query(ACCOUNT_SHELL_QUERY, {
    variables: {customerAccessToken: token},
  });

  if (result.errors?.length || !result.customer) {
    // The token is real but Shopify no longer recognizes it (revoked,
    // expired past what we tracked, customer deleted) — clear it and send
    // them back to sign in instead of showing a broken account page.
    clearCustomerSession(context.session);
    throw new Response(null, {status: 302, headers: {Location: '/account/login'}});
  }

  return remixData(
    {customer: result.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account.`
    : 'Account Details';

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-32 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            My Account
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">{heading}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-10 items-start">
          <AccountMenu />
          <div className="min-w-0">
            <Outlet context={{customer}} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  function navClass({isActive}: {isActive: boolean; isPending: boolean}) {
    return `block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
      isActive
        ? 'bg-[#241a16] text-[#f4f0e8] font-semibold shadow-sm'
        : 'text-[#3a2c24] hover:bg-[#f4f0e8] hover:text-[#241a16]'
    }`;
  }

  return (
    <nav
      role="navigation"
      // The mask fades the row's trailing edge on narrow screens, where this
      // is a horizontally-scrolling pill row (not the md: sidebar) — a visual
      // cue that "Sign out" continues past the edge instead of being cut off.
      className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible [mask-image:linear-gradient(to_right,black_calc(100%_-_2rem),transparent)] md:[mask-image:none] bg-white p-2 rounded-2xl border border-[#c9c2b8] md:sticky md:top-28"
    >
      <NavLink to="/account/profile" className={navClass}>
        Profile
      </NavLink>
      <NavLink to="/account/orders" className={navClass}>
        Orders
      </NavLink>
      <NavLink to="/account/addresses" className={navClass}>
        Addresses
      </NavLink>
      <div className="hidden md:block my-1 border-t border-[#e8e2d6]" />
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form method="POST" action="/account/logout">
      <button
        type="submit"
        className="block w-full text-left px-4 py-3 rounded-xl text-sm text-[#6d6560] hover:bg-[#f4f0e8] hover:text-[#241a16] transition-all duration-200 cursor-pointer whitespace-nowrap"
      >
        Sign out
      </button>
    </Form>
  );
}
