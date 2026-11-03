/**
 * RECENTLY VIEWED CONTEXT — UrbanEssentials
 *
 * Tracks the last MAX_RECENT product pages a visitor opened, most-recent
 * first, client-side only (localStorage) — no analytics/server tracking.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ShowcaseProduct } from '~/data/showcaseProducts';

export const MAX_RECENT = 8;

interface RecentlyViewedContextType {
  items: ShowcaseProduct[];
  recordView: (product: ShowcaseProduct) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const STORAGE_KEY = 'ue_showcase_recently_viewed_v1';

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShowcaseProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as ShowcaseProduct[]);
    } catch {
      // Ignore storage errors on client or private mode
    }
  }, []);

  const recordView = (product: ShowcaseProduct) => {
    setItems((prev) => {
      const next = [product, ...prev.filter((p) => p.id !== product.id)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  return (
    <RecentlyViewedContext.Provider value={{ items, recordView }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
}
