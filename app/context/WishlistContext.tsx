/**
 * WISHLIST CONTEXT — UrbanEssentials
 *
 * Same shape as CompareContext: local React state, synchronously persisted
 * to localStorage, no server round-trip. A signed-in customer's wishlist
 * doesn't sync across devices (would need a Shopify metafield write on the
 * customer record) — fine for a save-for-later list, revisit if that's
 * ever a complaint.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ShowcaseProduct } from '~/data/showcaseProducts';

interface WishlistContextType {
  items: ShowcaseProduct[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: ShowcaseProduct) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'ue_showcase_wishlist_v1';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShowcaseProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as ShowcaseProduct[]);
    } catch {
      // Ignore storage errors on client or private mode
    }
  }, []);

  function persist(next: ShowcaseProduct[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write errors
    }
  }

  const isWishlisted = (productId: string) => items.some((p) => p.id === productId);

  const toggleWishlist = (product: ShowcaseProduct) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      const next = exists ? prev.filter((p) => p.id !== product.id) : [product, ...prev];
      persist(next);
      return next;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      persist(next);
      return next;
    });
  };

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
