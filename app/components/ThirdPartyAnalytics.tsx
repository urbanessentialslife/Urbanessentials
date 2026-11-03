import {useEffect} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import {onStorefrontEvent, type StorefrontEventItem} from '~/lib/storefrontEvents';

/**
 * Optional GA4 and Meta Pixel tracking, bridged from Hydrogen's analytics
 * bus (page/product/collection/search views) and the cart's own DOM events
 * (add to cart, begin checkout — see app/lib/storefrontEvents.ts).
 *
 * Each vendor only loads when its ID is configured (PUBLIC_GA4_MEASUREMENT_ID,
 * PUBLIC_META_PIXEL_ID) AND the visitor's Shopify consent allows it:
 * Hydrogen only publishes events once analytics processing is allowed, and
 * the Meta Pixel additionally requires marketing consent. Purchases are
 * tracked on Shopify's checkout itself (Admin → Settings → Customer events
 * or the Google & YouTube / Facebook & Instagram sales channel apps), which
 * this headless storefront can't see.
 */

type FbqFunction = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: FbqFunction;
    _fbq?: unknown;
  }
}

function loadScript(src: string, nonce?: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  if (nonce) script.nonce = nonce;
  document.head.appendChild(script);
}

function ensureGtag(measurementId: string, nonce?: string): NonNullable<Window['gtag']> {
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag.js expects the raw `arguments` object, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    // Page views are sent manually on each client-side navigation below.
    window.gtag('config', measurementId, {send_page_view: false});
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`, nonce);
  }
  return window.gtag;
}

function ensureFbq(pixelId: string, nonce?: string): NonNullable<Window['fbq']> | null {
  if (!window.Shopify?.customerPrivacy?.marketingAllowed?.()) return null;
  if (!window.fbq) {
    // Meta's standard queueing stub, without the inline <script> snippet.
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    }) as FbqFunction;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = fbq;
    window.fbq = fbq;
    window._fbq = fbq;
    loadScript('https://connect.facebook.net/en_US/fbevents.js', nonce);
    window.fbq('init', pixelId);
  }
  return window.fbq;
}

function gaItems(items: StorefrontEventItem[]) {
  return items.map((item) => ({
    item_id: item.id,
    item_name: item.title,
    item_variant: item.variantTitle,
    price: item.price,
    quantity: item.quantity,
  }));
}

export function ThirdPartyAnalytics({
  ga4Id,
  metaPixelId,
  nonce,
}: {
  ga4Id: string | null;
  metaPixelId: string | null;
  nonce?: string;
}) {
  const {subscribe, register} = useAnalytics();
  const {ready} = register('ThirdPartyAnalytics');

  useEffect(() => {
    if (!ga4Id && !metaPixelId) {
      ready();
      return;
    }

    const ga = () => (ga4Id ? ensureGtag(ga4Id, nonce) : null);
    const fb = () => (metaPixelId ? ensureFbq(metaPixelId, nonce) : null);

    subscribe('page_viewed', (data) => {
      ga()?.('event', 'page_view', {page_location: data.url, page_title: document.title});
      fb()?.('track', 'PageView');
    });

    subscribe('product_viewed', (data) => {
      const product = data.products?.[0];
      if (!product) return;
      const currency = data.shop?.currency;
      ga()?.('event', 'view_item', {
        currency,
        value: Number(product.price),
        items: [{item_id: product.id, item_name: product.title, item_variant: product.variantTitle, price: Number(product.price)}],
      });
      fb()?.('track', 'ViewContent', {
        content_ids: [product.id],
        content_name: product.title,
        content_type: 'product',
        currency,
        value: Number(product.price),
      });
    });

    subscribe('collection_viewed', (data) => {
      ga()?.('event', 'view_item_list', {item_list_id: data.collection.handle, item_list_name: data.collection.handle});
    });

    subscribe('search_viewed', (data) => {
      if (!data.searchTerm) return;
      ga()?.('event', 'search', {search_term: data.searchTerm});
      fb()?.('track', 'Search', {search_string: data.searchTerm});
    });

    ready();

    // Cart events come straight from the cart context. Only forward them
    // once a vendor has already been loaded by a consented page view above.
    const offAdd = onStorefrontEvent('add_to_cart', (detail) => {
      window.gtag?.('event', 'add_to_cart', {currency: detail.currency, value: detail.value, items: gaItems(detail.items)});
      window.fbq?.('track', 'AddToCart', {
        content_ids: detail.items.map((i) => i.id),
        content_type: 'product',
        currency: detail.currency,
        value: detail.value,
      });
    });
    const offCheckout = onStorefrontEvent('begin_checkout', (detail) => {
      window.gtag?.('event', 'begin_checkout', {currency: detail.currency, value: detail.value, items: gaItems(detail.items)});
      window.fbq?.('track', 'InitiateCheckout', {
        content_ids: detail.items.map((i) => i.id),
        currency: detail.currency,
        value: detail.value,
        num_items: detail.items.reduce((n, i) => n + i.quantity, 0),
      });
    });

    return () => {
      offAdd();
      offCheckout();
    };
    // Subscriptions are registered once for the lifetime of the app shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
