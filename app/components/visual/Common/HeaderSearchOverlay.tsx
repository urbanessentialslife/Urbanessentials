import React, { useEffect, useRef, useState } from 'react';
import { Link, useFetcher } from 'react-router';
import { Image, Money } from '@shopify/hydrogen';
import { getEmptyPredictiveSearchResult, type PredictiveSearchReturn } from '~/lib/search';
import { useDialogTransition } from '~/hooks/useDialogTransition';

interface HeaderSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Live-typing search dropdown anchored under the header — reuses the same
 * `/search?predictive=true` loader that already powers the full search page
 * (see app/routes/search.tsx), just rendered inline instead of navigating.
 */
export function HeaderSearchOverlay({ isOpen, onClose }: HeaderSearchOverlayProps) {
  const fetcher = useFetcher<PredictiveSearchReturn>({ key: 'header-predictive-search' });
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { handleClose, isClosing } = useDialogTransition(panelRef, onClose, {
    enterFrom: { opacity: 0, y: -12 },
    isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTerm('');
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTerm(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) return;

    debounceRef.current = setTimeout(() => {
      void fetcher.submit(
        { q: value, limit: '6', predictive: 'true' },
        { method: 'GET', action: '/search' },
      );
    }, 200);
  };

  if (!isOpen) return null;

  const { items, total } = fetcher.data?.result ?? getEmptyPredictiveSearchResult();
  const isLoading = fetcher.state !== 'idle';
  const hasTyped = term.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 font-sans">
      <div
        className={`absolute inset-0 bg-[#241a16]/30 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative max-w-xl mx-4 sm:mx-auto mt-24 sm:mt-28 bg-[#f4f0e8] rounded-3xl shadow-2xl overflow-hidden"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (term.trim()) window.location.href = `/search?q=${encodeURIComponent(term.trim())}`;
          }}
          className="flex items-center gap-2 p-4 border-b border-[#c9c2b8] bg-white"
        >
          <svg className="w-4.5 h-4.5 text-[#a69686] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={handleChange}
            placeholder="Search products, journal, and more…"
            className="flex-1 bg-transparent border-0 outline-none text-sm text-[#241a16] placeholder-[#a69686]"
          />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close search"
            className="p-1.5 text-[#6d6560] hover:text-[#241a16] rounded-full hover:bg-[#f4f0e8] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {!hasTyped ? (
            <p className="text-xs text-[#6d6560] text-center py-6">
              Start typing to search the catalog and journal.
            </p>
          ) : isLoading && !fetcher.data ? (
            <p className="text-xs text-[#6d6560] text-center py-6">Searching…</p>
          ) : total === 0 ? (
            <p className="text-xs text-[#6d6560] text-center py-6">
              No results for &ldquo;{term}&rdquo;.
            </p>
          ) : (
            <div className="space-y-5">
              {items.products.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-[#6d6560] font-semibold mb-2 px-1">
                    Products
                  </h3>
                  <div className="space-y-1">
                    {items.products.map((product) => {
                      const variant = product.selectedOrFirstAvailableVariant;
                      return (
                        <Link
                          key={product.id}
                          to={`/products/${product.handle}`}
                          onClick={handleClose}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors"
                        >
                          {variant?.image && (
                            <Image
                              data={variant.image}
                              alt={product.title}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover w-10 h-10 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-[#241a16] font-medium truncate">{product.title}</p>
                            {variant?.price && (
                              <p className="text-xs text-[#6d6560]">
                                <Money data={variant.price} />
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {items.collections.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-[#6d6560] font-semibold mb-2 px-1">
                    Collections
                  </h3>
                  <div className="space-y-1">
                    {items.collections.map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/collections/${collection.handle}`}
                        onClick={handleClose}
                        className="block p-2 rounded-xl hover:bg-white transition-colors text-sm text-[#241a16] font-medium"
                      >
                        {collection.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {items.articles.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-[#6d6560] font-semibold mb-2 px-1">
                    Journal
                  </h3>
                  <div className="space-y-1">
                    {items.articles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/blogs/${article.blog.handle}/${article.handle}`}
                        onClick={handleClose}
                        className="block p-2 rounded-xl hover:bg-white transition-colors text-sm text-[#241a16] font-medium"
                      >
                        {article.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Link
                to={`/search?q=${encodeURIComponent(term)}`}
                onClick={handleClose}
                className="block text-center text-xs uppercase tracking-widest text-[#241a16] hover:text-[#a69686] font-medium py-2"
              >
                View all results →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
