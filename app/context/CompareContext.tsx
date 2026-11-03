/**
 * COMPARE CONTEXT — UrbanEssentials
 *
 * Lets a visitor flag up to MAX_COMPARE products from any card to view
 * side-by-side on /compare. Mirrors ShowcaseCartContext's shape (local
 * React state, synchronously persisted to localStorage) since it's the
 * same "lightweight client-side list, no server round-trip" pattern.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ShowcaseProduct } from '~/data/showcaseProducts';

export const MAX_COMPARE = 4;

interface CompareContextType {
  items: ShowcaseProduct[];
  isCompared: (productId: string) => boolean;
  toggleCompare: (product: ShowcaseProduct) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = 'ue_showcase_compare_v1';

export function CompareProvider({ children }: { children: React.ReactNode }) {
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

  const isCompared = (productId: string) => items.some((p) => p.id === productId);

  const toggleCompare = (product: ShowcaseProduct) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      let next: ShowcaseProduct[];
      if (exists) {
        next = prev.filter((p) => p.id !== product.id);
      } else if (prev.length >= MAX_COMPARE) {
        // Already at the cap — drop the oldest pick to make room rather
        // than silently refusing the tap.
        next = [...prev.slice(1), product];
      } else {
        next = [...prev, product];
      }
      persist(next);
      return next;
    });
  };

  const removeFromCompare = (productId: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      persist(next);
      return next;
    });
  };

  const clearCompare = () => {
    setItems([]);
    persist([]);
  };

  return (
    <CompareContext.Provider value={{ items, isCompared, toggleCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
