/**
 * Browser-side commerce events for third-party analytics (GA4 / Meta Pixel,
 * see app/components/ThirdPartyAnalytics.tsx).
 *
 * The cart here is local state that only becomes a real Shopify cart at
 * checkout (see ShowcaseCartContext.tsx), so Hydrogen's built-in cart
 * analytics never sees an add-to-cart. These plain DOM events fill that gap
 * without coupling the cart to any particular analytics vendor.
 */

export interface StorefrontEventItem {
  id: string;
  title: string;
  variantId: string;
  variantTitle: string;
  price: number;
  quantity: number;
}

export interface StorefrontEventMap {
  add_to_cart: {currency: string; value: number; items: StorefrontEventItem[]};
  begin_checkout: {currency: string; value: number; items: StorefrontEventItem[]};
}

const PREFIX = 'ue:';

export function emitStorefrontEvent<K extends keyof StorefrontEventMap>(
  name: K,
  detail: StorefrontEventMap[K],
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PREFIX + name, {detail}));
}

export function onStorefrontEvent<K extends keyof StorefrontEventMap>(
  name: K,
  handler: (detail: StorefrontEventMap[K]) => void,
): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<StorefrontEventMap[K]>).detail);
  window.addEventListener(PREFIX + name, listener);
  return () => window.removeEventListener(PREFIX + name, listener);
}
