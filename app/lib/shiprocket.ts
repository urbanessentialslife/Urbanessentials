/**
 * Shiprocket Fastrr Headless Checkout Integration
 * Specification based on Pickrr/Shiprocket Fastrr Custom Frontend documentation.
 */

export interface ShiprocketProductItem {
  variantId: string;
  quantity: number;
}

export interface ShiprocketBuyDirectParams {
  /** Checkout initiation source: 'cart' or 'product' */
  type: 'cart' | 'product';
  /** Products list with numeric variantId and quantity */
  products: ShiprocketProductItem[];
  /** Optional discount/coupon code */
  couponCode?: string;
  /** Optional UTM parameters query string */
  utmParams?: string;
  /** Optional cart custom attributes object */
  cartAttributes?: Record<string, string>;
  /** Optional fallback URL if modal fails */
  fallbackUrl?: string;
}

declare global {
  interface Window {
    shiprocketCheckoutEvents?: {
      buyDirect: (params: ShiprocketBuyDirectParams) => void;
    };
    HeadlessCheckout?: {
      buyNow: (params: unknown) => void;
      checkout: (params: unknown) => void;
    };
  }
}

/**
 * Strips GraphQL GID prefix to provide the clean numeric variant ID required by Shiprocket.
 * Example: 'gid://shopify/ProductVariant/542094950619' -> '542094950619'
 */
export function cleanVariantId(id: string | number): string {
  return String(id).replace(/^gid:\/\/shopify\/ProductVariant\//, '');
}

/**
 * Cleans up any stale or orphaned Fastrr modal DOM elements that might block subsequent checkouts.
 */
export function cleanupStaleFastrrContainers(): void {
  if (typeof window === 'undefined') return;
  try {
    const mainContainer = document.getElementById('fastrr-main-container');
    if (mainContainer) mainContainer.remove();

    const headlessContainer = document.getElementById('headless-container');
    if (headlessContainer) headlessContainer.remove();

    const preLoader = document.getElementById('fastrr-pre-loader');
    if (preLoader) preLoader.remove();

    const prefetchContainer = document.getElementById('fastrr-prefetch-container');
    if (prefetchContainer) prefetchContainer.remove();

    if (document.body) {
      document.body.style.overflow = '';
      if (document.body.style.height === '100vh') {
        document.body.style.height = '';
      }
    }
  } catch (err) {
    console.warn('[Shiprocket] Error cleaning up stale containers:', err);
  }
}

/**
 * Ensures the registered seller domain is present in the hidden input.
 */
export function ensureFastrrSellerDomain(): void {
  if (typeof window === 'undefined') return;
  let el = document.getElementById('sellerDomain') as HTMLInputElement | null;
  if (!el) {
    el = document.createElement('input');
    el.type = 'hidden';
    el.id = 'sellerDomain';
    document.body.appendChild(el);
  }
  el.value = 'urban-essentials-jcqspwgr.myshopify.com';
}

/**
 * Checks whether the Shiprocket Fastrr checkout script has finished loading.
 */
export function isShiprocketAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.shiprocketCheckoutEvents && typeof window.shiprocketCheckoutEvents.buyDirect === 'function')
  );
}

/**
 * Initiates Fastrr 1-click checkout with the given parameters.
 * Cleans up any stale modal DOM beforehand so consecutive or back-navigated checkouts never freeze.
 * Sets fallbackUrl to the current window location to ensure Shopify native checkout is never opened.
 */
export async function triggerShiprocketCheckoutAsync(
  params: ShiprocketBuyDirectParams,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const directParams: ShiprocketBuyDirectParams = {
    ...params,
    fallbackUrl: params.fallbackUrl || window.location.href,
  };

  const invoke = () => {
    cleanupStaleFastrrContainers();
    ensureFastrrSellerDomain();
    console.log('[Shiprocket] Invoking buyDirect:', directParams);
    window.shiprocketCheckoutEvents!.buyDirect(directParams);
  };

  // If already ready, clean and invoke immediately
  if (isShiprocketAvailable()) {
    try {
      invoke();
      return true;
    } catch (error) {
      console.warn('[Shiprocket] Initial Fastrr buyDirect failed, retrying with fresh DOM:', error);
      try {
        cleanupStaleFastrrContainers();
        invoke();
        return true;
      } catch (retryError) {
        console.error('[Shiprocket] Fastrr buyDirect retry failed:', retryError);
        return false;
      }
    }
  }

  // If script tag is still loading, poll for up to 3000ms
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (isShiprocketAvailable()) {
      try {
        invoke();
        return true;
      } catch (error) {
        console.warn('[Shiprocket] Fastrr buyDirect failed after wait, retrying:', error);
        try {
          cleanupStaleFastrrContainers();
          invoke();
          return true;
        } catch (retryError) {
          console.error('[Shiprocket] Fastrr buyDirect retry failed:', retryError);
          return false;
        }
      }
    }
  }

  console.warn('[Shiprocket] Fastrr script not available after polling.');
  return false;
}

export function triggerShiprocketCheckout(params: ShiprocketBuyDirectParams): boolean {
  if (isShiprocketAvailable()) {
    try {
      cleanupStaleFastrrContainers();
      ensureFastrrSellerDomain();
      window.shiprocketCheckoutEvents!.buyDirect({
        ...params,
        fallbackUrl: params.fallbackUrl || window.location.href,
      });
      return true;
    } catch (error) {
      console.warn('Shiprocket Fastrr buyDirect failed:', error);
      return false;
    }
  }
  return false;
}
