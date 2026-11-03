/**
 * SHOWCASE CART CONTEXT — UrbanEssentials
 *
 * The shopping list itself (add/remove/update, drawer state, localStorage
 * persistence) stays local React state — every product/variant `.id` here
 * is already a real Shopify GID (see app/lib/showcaseCommerce.ts), so at
 * checkout time this list is submitted as a real Shopify cart in one shot
 * and the visitor is redirected to the real, hosted Shopify checkout.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useFetcher, useRouteLoaderData } from 'react-router';
import type { RootLoader } from '~/root';
import { emitStorefrontEvent, type StorefrontEventItem } from '~/lib/storefrontEvents';
import { CartForm, type CartQueryDataReturn } from '@shopify/hydrogen';
import type { ShowcaseProduct, ProductVariant } from '~/data/showcaseProducts';
import { cleanVariantId, triggerShiprocketCheckoutAsync } from '~/lib/shiprocket';

export interface ShowcaseCartItem {
  id: string; // Unique cart line item ID (product.id + '-' + variant.id)
  product: ShowcaseProduct;
  variant: ProductVariant;
  quantity: number;
  /** The name the customer wants personalized onto the product, if any —
   * only meaningful when product.customization?.enabled is true. */
  customName?: string;
}

interface ShowcaseCartContextType {
  items: ShowcaseCartItem[];
  totalQuantity: number;
  subtotal: number;
  currencySymbol: string;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (
    product: ShowcaseProduct,
    variantId?: string,
    quantity?: number,
    customName?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  lastAddedItem: ShowcaseCartItem | null;
  /** The handwritten gift note draft. */
  giftNote: string;
  setGiftNote: (note: string) => void;
  /** The promo/discount code draft — applied to the real Shopify cart at
   * checkout time (Shopify validates it there; an invalid code simply
   * doesn't discount anything, same as typing one directly into checkout). */
  discountCode: string;
  setDiscountCode: (code: string) => void;
  /** Submits the current items as a real Shopify cart and redirects to its
   * checkout — no account required; Shopify's hosted checkout collects
   * contact/shipping details from guests same as signed-in customers.
   * Any gift note and discount code are written onto that same cart via
   * Shopify's own `note` and `discountCodes` fields. */
  checkout: () => Promise<void>;
  isCheckingOut: boolean;
  checkoutError: string | null;
  /** Set when Shopify silently adjusted the cart (e.g. a quantity capped by
   * stock) — checkout is paused so the visitor can see what changed before
   * being sent to pay for it. */
  checkoutWarning: string | null;
  /** Continues to Shopify's checkout after a checkoutWarning was shown. */
  proceedToCheckout: () => void;
}

const ShowcaseCartContext = createContext<ShowcaseCartContextType | undefined>(undefined);

const STORAGE_KEY = 'ue_showcase_cart_v1';
const GIFT_NOTE_STORAGE_KEY = 'ue_showcase_gift_note_v1';
const DISCOUNT_CODE_STORAGE_KEY = 'ue_showcase_discount_code_v1';

export function ShowcaseCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShowcaseCartItem[]>([]);
  const [giftNote, setGiftNote] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<ShowcaseCartItem | null>(null);
  const [restored, setRestored] = useState(false);
  const lastAddTimestampRef = useRef<Record<string, number>>({});

  // Restore cart (and any in-progress gift note) from localStorage on client
  // mount. Persistence itself intentionally does NOT live in a matching
  // `useEffect(() => localStorage.setItem(...), [items])` below this — that
  // pattern races this restore on every fresh page load: the save-effect's
  // first run closes over the pre-restore (empty) `items`/`giftNote` and
  // clobbers storage before the restored state has committed (worse still
  // under React 18 StrictMode's dev-only double effect invocation, which
  // can make the clobber stick permanently). Persisting is instead done
  // synchronously inside each mutator below, against the real previous
  // state React hands it — see persistItems/updateGiftNote.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored) as ShowcaseCartItem[]);
      }
      const storedNote = localStorage.getItem(GIFT_NOTE_STORAGE_KEY);
      if (storedNote) setGiftNote(storedNote);
      const storedCode = localStorage.getItem(DISCOUNT_CODE_STORAGE_KEY);
      if (storedCode) setDiscountCode(storedCode);
    } catch {
      // Ignore storage errors on client or private mode
    }
    setRestored(true);
  }, []);

  // Saved items carry a snapshot of price/currency from when they were
  // added. Re-price them from the live catalog once on load and again
  // whenever the visitor switches country, so the drawer always matches
  // what checkout will charge (admin price edits, market currencies).
  const marketCountry = useRouteLoaderData<RootLoader>('root')?.localization?.country.isoCode;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    if (!restored) return;
    const ids = [...new Set(itemsRef.current.map((item) => item.product.id))].filter((id) =>
      id.startsWith('gid://shopify/Product/'),
    );
    if (ids.length === 0) return;

    let cancelled = false;
    fetch(`/api/cart-products?ids=${encodeURIComponent(ids.join(','))}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ products: Record<string, ShowcaseProduct> }>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setItems((prev) => {
          const next = prev.map((item) => {
            const fresh = data.products[item.product.id];
            const variant = fresh?.variants.find((v) => v.id === item.variant.id);
            return fresh && variant ? { ...item, product: fresh, variant } : item;
          });
          persistItems(next);
          return next;
        });
      })
      .catch(() => {
        // Keep the saved snapshot; checkout re-prices server-side anyway.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored, marketCountry]);

  function persistItems(next: ShowcaseCartItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write errors
    }
  }

  // Wraps setGiftNote so every update — including the drawer's textarea —
  // persists in the same step; see the note above for why this isn't a
  // separate `useEffect(() => ..., [giftNote])` instead.
  function updateGiftNote(note: string) {
    setGiftNote(note);
    try {
      if (note) {
        localStorage.setItem(GIFT_NOTE_STORAGE_KEY, note);
      } else {
        localStorage.removeItem(GIFT_NOTE_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write errors
    }
  }

  // Same reasoning as updateGiftNote above.
  function updateDiscountCode(code: string) {
    setDiscountCode(code);
    try {
      if (code) {
        localStorage.setItem(DISCOUNT_CODE_STORAGE_KEY, code);
      } else {
        localStorage.removeItem(DISCOUNT_CODE_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write errors
    }
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const customizationFee =
      item.customName && item.product.customization?.enabled
        ? item.product.customization.feeAmount * item.quantity
        : 0;
    return sum + item.product.price * item.quantity + customizationFee;
  }, 0);
  const currencySymbol = items[0]?.product.currencySymbol || '₹';

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const checkoutFetcher = useFetcher<{
    cart?: CartQueryDataReturn['cart'];
    errors?: {message: string}[];
    warnings?: {message: string}[];
  }>({
    key: 'showcase-checkout',
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutWarning, setCheckoutWarning] = useState<string | null>(null);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);

  const checkout = async () => {
    if (items.length === 0) return;

    emitStorefrontEvent('begin_checkout', {
      currency: items[0].product.currency,
      value: subtotal,
      items: items.map((item) => toEventItem(item.product, item.variant, item.quantity)),
    });

    setIsCheckingOut(true);
    setCheckoutError(null);

    // Shiprocket Fastrr headless 1-click checkout
    const fastrrProducts: { variantId: string; quantity: number }[] = [];
    items.forEach((item) => {
      fastrrProducts.push({
        variantId: cleanVariantId(item.variant.id),
        quantity: item.quantity,
      });
      if (
        item.customName &&
        item.product.customization?.enabled &&
        item.product.customization.feeVariantId
      ) {
        fastrrProducts.push({
          variantId: cleanVariantId(item.product.customization.feeVariantId),
          quantity: item.quantity,
        });
      }
    });

    const fastrrCartAttributes: Record<string, string> = {};
    if (giftNote.trim()) {
      fastrrCartAttributes['Gift Note'] = giftNote.trim();
    }
    items.forEach((item, idx) => {
      if (item.customName) {
        fastrrCartAttributes[`Customization_${idx + 1}`] = `${item.product.title}: ${item.customName}`;
      }
    });

    const launchedFastrr = await triggerShiprocketCheckoutAsync({
      type: 'cart',
      products: fastrrProducts,
      ...(discountCode.trim() ? { couponCode: discountCode.trim() } : {}),
      ...(Object.keys(fastrrCartAttributes).length > 0
        ? { cartAttributes: fastrrCartAttributes }
        : {}),
    });

    setIsCheckingOut(false);

    if (launchedFastrr) {
      closeDrawer();
      return;
    }

    setCheckoutError('Fastrr 1-Click Checkout open nahi ho paya. Kripya thoda wait karke dobara try karein.');
  };

  // Writes the gift note and any discount code onto the real cart (Shopify's
  // own `note` and `discountCodes` fields — see NoteUpdate/DiscountCodesUpdate
  // in app/routes/cart.tsx) and redirects to Shopify's hosted checkout.
  const goToCheckout = (checkoutUrl: string) => {
    const note = giftNote.trim();
    const code = discountCode.trim();

    // `keepalive` lets each fetch survive the redirect that follows
    // immediately — a plain fetch would otherwise get cancelled the instant
    // navigation starts. Both are fire-and-forget: an invalid/failed code or
    // note should never block the visitor from reaching checkout.
    const requests: Promise<unknown>[] = [];

    if (code) {
      const codeForm = new FormData();
      codeForm.append(
        CartForm.INPUT_NAME,
        JSON.stringify({ action: CartForm.ACTIONS.DiscountCodesUpdate, inputs: { discountCode: code } }),
      );
      requests.push(
        fetch('/cart', { method: 'POST', body: codeForm, keepalive: true }).catch(() => {}),
      );
    }

    if (note) {
      const noteForm = new FormData();
      noteForm.append(
        CartForm.INPUT_NAME,
        JSON.stringify({ action: CartForm.ACTIONS.NoteUpdate, inputs: { note } }),
      );
      requests.push(
        fetch('/cart', { method: 'POST', body: noteForm, keepalive: true }).catch(() => {}),
      );
    }

    if (requests.length === 0) {
      window.location.href = checkoutUrl;
      return;
    }

    void Promise.allSettled(requests).finally(() => {
      updateGiftNote('');
      updateDiscountCode('');
      window.location.href = checkoutUrl;
    });
  };

  // Picks up the real cart mutation's result once it resolves.
  useEffect(() => {
    if (checkoutFetcher.state !== 'idle' || !isCheckingOut) return;

    const data = checkoutFetcher.data;
    if (!data) return;

    const checkoutUrl = data.cart?.checkoutUrl;
    if (!checkoutUrl) {
      setIsCheckingOut(false);
      setCheckoutError(
        data.errors?.[0]?.message || 'Checkout could not be started. Please try again.',
      );
      return;
    }

    if (data.warnings?.length) {
      // Shopify silently adjusted the cart — most commonly a line's
      // quantity capped down to what's actually in stock. Pause here so
      // the visitor sees what changed before paying for it, instead of a
      // surprise on Shopify's own checkout page.
      setIsCheckingOut(false);
      setCheckoutWarning(data.warnings.map((w) => w.message).join(' '));
      setPendingCheckoutUrl(checkoutUrl);
      return;
    }

    goToCheckout(checkoutUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutFetcher.state, checkoutFetcher.data]);

  const proceedToCheckout = () => {
    if (!pendingCheckoutUrl) return;
    setCheckoutWarning(null);
    goToCheckout(pendingCheckoutUrl);
    setPendingCheckoutUrl(null);
  };

  const addItem = (
    product: ShowcaseProduct,
    variantId?: string,
    quantity = 1,
    customName?: string
  ) => {
    const targetVariant =
      product.variants.find((v) => v.id === variantId) ||
      product.variants.find((v) => v.id === product.defaultVariantId) ||
      product.variants[0];

    const safeQuantity = Math.max(1, parseInt(String(quantity), 10) || 1);

    // Different personalizations of the same product/variant are distinct
    // lines (each needs its own name carried through to checkout) — only
    // merge quantity when the name matches (including two un-personalized adds).
    const lineId = customName
      ? `${product.id}-${targetVariant.id}-${customName}`
      : `${product.id}-${targetVariant.id}`;

    // Debounce rapid duplicate add clicks within 400ms (prevents accidental 1+1=2 double-taps)
    const now = Date.now();
    if (lastAddTimestampRef.current[lineId] && now - lastAddTimestampRef.current[lineId] < 400) {
      console.warn('[Cart] Debouncing rapid duplicate add for:', lineId);
      setIsDrawerOpen(true);
      return;
    }
    lastAddTimestampRef.current[lineId] = now;

    emitStorefrontEvent('add_to_cart', {
      currency: product.currency,
      value: product.price * safeQuantity,
      items: [toEventItem(product, targetVariant, safeQuantity)],
    });

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === lineId);
      let updated: ShowcaseCartItem[];

      if (existingIndex > -1) {
        updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + safeQuantity,
        };
      } else {
        const newItem: ShowcaseCartItem = {
          id: lineId,
          product,
          variant: targetVariant,
          quantity: safeQuantity,
          customName,
        };
        updated = [newItem, ...prevItems];
      }

      const activeItem = updated.find((i) => i.id === lineId) || null;
      setLastAddedItem(activeItem);
      persistItems(updated);
      return updated;
    });

    // Auto-open drawer to showcase smooth feedback
    setIsDrawerOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== itemId);
      persistItems(next);
      return next;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, quantity } : item));
      persistItems(next);
      return next;
    });
  };

  const clearCart = () => {
    setItems([]);
    persistItems([]);
  };

  return (
    <ShowcaseCartContext.Provider
      value={{
        items,
        totalQuantity,
        subtotal,
        currencySymbol,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        lastAddedItem,
        giftNote,
        setGiftNote: updateGiftNote,
        discountCode,
        setDiscountCode: updateDiscountCode,
        checkout,
        isCheckingOut,
        checkoutWarning,
        proceedToCheckout,
        checkoutError,
      }}
    >
      {children}
    </ShowcaseCartContext.Provider>
  );
}

export function useShowcaseCart() {
  const context = useContext(ShowcaseCartContext);
  if (!context) {
    throw new Error('useShowcaseCart must be used within a ShowcaseCartProvider');
  }
  return context;
}

function toEventItem(product: ShowcaseProduct, variant: ProductVariant, quantity: number): StorefrontEventItem {
  return {
    id: product.id,
    title: product.title,
    variantId: variant.id,
    variantTitle: variant.name,
    price: product.price,
    quantity,
  };
}
