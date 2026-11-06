import {useEffect} from 'react';
import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.png';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import {resolveNavMenus} from '~/lib/navMenus';
import {getCustomerAccessToken} from '~/lib/customerAuth.server';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/PageLayout';
import {ThirdPartyAnalytics} from './components/ThirdPartyAnalytics';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  return false;
};

export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap',
    },
    {
      // Shiprocket Fastrr Headless Checkout CSS
      rel: 'stylesheet',
      href: 'https://fastrr-boost-ui.pickrr.com/assets/styles/shopify.css',
    },
    {rel: 'icon', href: '/favicon.ico', sizes: 'any'},
    {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png'},
    {rel: 'icon', type: 'image/png', sizes: '512x512', href: favicon},
    {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;
  const origin = new URL(args.request.url).origin;

  let shopAnalytics: any = null;
  try {
    shopAnalytics = getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    })?.catch(() => ({
      shopId: 'gid://shopify/Shop/1',
      acceptedLanguage: 'EN',
      currency: 'INR',
    }));
  } catch {
    shopAnalytics = Promise.resolve({
      shopId: 'gid://shopify/Shop/1',
      acceptedLanguage: 'EN',
      currency: 'INR',
    });
  }

  return {
    ...deferredData,
    ...criticalData,
    origin,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shiprocketSellerDomain: env.PUBLIC_SHIPROCKET_SELLER_DOMAIN || 'urban-essentials-jcqspwgr.myshopify.com',
    supportEmail: env.PUBLIC_SUPPORT_EMAIL ?? null,
    whatsappNumber: env.PUBLIC_WHATSAPP_NUMBER ?? null,
    ga4Id: env.PUBLIC_GA4_MEASUREMENT_ID || null,
    metaPixelId: env.PUBLIC_META_PIXEL_ID || '2581550922313854',
    socialLinks: [
      {label: 'Instagram', url: env.PUBLIC_INSTAGRAM_URL},
      {label: 'Pinterest', url: env.PUBLIC_PINTEREST_URL},
      {label: 'LinkedIn', url: env.PUBLIC_LINKEDIN_URL},
    ].filter((link): link is {label: string; url: string} => Boolean(link.url)),
    shop: shopAnalytics,
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN || 'urban-essentials-jcqspwgr.myshopify.com',
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: true,
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header, categoriesResult, localizationResult] = await Promise.all([
    storefront
      .query(HEADER_QUERY, {
        cache: storefront.CacheLong(),
        variables: {
          headerMenuHandle: 'main-menu',
        },
      })
      .catch((error: Error) => {
        console.warn('Storefront header query fallback:', error?.message);
        return null;
      }),
    storefront
      .query<NavCategoriesQueryResult>(NAV_CATEGORIES_QUERY, {
        cache: storefront.CacheLong(),
      })
      .catch((error: Error) => {
        console.warn('Storefront nav categories query fallback:', error?.message);
        return null;
      }),
    storefront
      .query(LOCALIZATION_QUERY, {cache: storefront.CacheLong()})
      .catch((error: Error) => {
        console.warn('Storefront localization query fallback:', error?.message);
        return null;
      }),
  ]);

  const navCollectionImages: Record<string, string> = {};
  for (const collection of categoriesResult?.collections?.nodes ?? []) {
    if (collection.image?.url) navCollectionImages[collection.handle] = collection.image.url;
  }

  const categories = (categoriesResult?.collections?.nodes ?? [])
    .filter((collection) => collection.handle !== 'frontpage');

  return {
    header: header || {
      shop: {
        id: 'gid://shopify/Shop/1',
        name: 'UrbanEssentials',
        description: 'Architectural everyday tumblers and bespoke curated gifts.',
        primaryDomain: { url: 'https://urbanessentials.myshopify.com' },
      },
      menu: null,
    },
    categories,
    navCollectionImages,
    navMenus: resolveNavMenus(header?.menu?.items),
    localization: localizationResult?.localization ?? null,
  };
}

const LOCALIZATION_QUERY = `#graphql
  query StoreLocalization($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    localization {
      country {
        isoCode
        name
        currency {
          isoCode
          symbol
        }
      }
      availableCountries {
        isoCode
        name
        currency {
          isoCode
          symbol
        }
      }
    }
  }
` as const;

interface NavCategoriesQueryResult {
  collections: {nodes: {handle: string; title: string; image: {url: string} | null}[]};
}

const NAV_CATEGORIES_QUERY = `#graphql
  query NavCategories($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 100, sortKey: TITLE) {
      nodes {
        handle
        title
        image {
          url(transform: {maxWidth: 400, maxHeight: 400, crop: CENTER})
        }
      }
    }
  }
` as const;

function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, cart} = context;

  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer',
      },
    })
    .catch(() => null);

  return {
    cart: cart.get().catch(() => null),
    isLoggedIn: Promise.resolve(Boolean(getCustomerAccessToken(context.session))),
    footer,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={tailwindCss}></link>
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        {/* Shiprocket Fastrr Checkout Styles */}
        <link rel="stylesheet" href="https://fastrr-boost-ui.pickrr.com/assets/styles/shopify.css" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* Shiprocket Fastrr Integration */}
        <input type="hidden" value="urban-essentials-jcqspwgr.myshopify.com" id="sellerDomain" />
        <script src="https://fastrr-boost-ui.pickrr.com/assets/js/channels/shopify.js" defer nonce={nonce}></script>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');
  const nonce = useNonce();

  useEffect(() => {
    const el = document.getElementById('sellerDomain') as HTMLInputElement | null;
    if (el) {
      el.value = data?.shiprocketSellerDomain || 'urban-essentials-jcqspwgr.myshopify.com';
    }
  }, [data?.shiprocketSellerDomain]);

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
      <ThirdPartyAnalytics ga4Id={data.ga4Id} metaPixelId={data.metaPixelId} nonce={nonce} />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Urban Essentials',
            url: data.origin,
            logo: `${data.origin}${favicon}`,
          }).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Urban Essentials',
            url: data.origin,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${data.origin}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }).replace(/</g, '\\u003c'),
        }}
      />
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const data = useRouteLoaderData<RootLoader>('root');
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const displayMessage = import.meta.env.DEV
    ? errorMessage
    : errorStatus === 404
      ? "The page you're looking for doesn't exist or has moved."
      : 'An unexpected error occurred. Please try again in a moment.';

  const content = (
    <div className="urbanessentials-showcase min-h-[70vh] bg-[#f4f0e8] text-[#241a16] font-sans flex flex-col items-center justify-center text-center px-6">
      <title>{errorStatus === 404 ? 'Page Not Found' : 'Something Went Wrong'} | UrbanEssentials</title>
      <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
        {errorStatus === 404 ? 'Page Not Found' : 'Something Went Wrong'}
      </span>
      <h1 className="text-4xl md:text-5xl font-serif font-light text-[#241a16] mt-3 mb-4">
        {errorStatus}
      </h1>
      {displayMessage && (
        <p className="text-xs text-[#6d6560] max-w-lg whitespace-pre-wrap mb-8">
          {displayMessage}
        </p>
      )}
      <a
        href="/"
        className="px-8 py-3 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200"
      >
        Return Home
      </a>
    </div>
  );

  if (!data) return content;

  return <PageLayout {...data}>{content}</PageLayout>;
}
