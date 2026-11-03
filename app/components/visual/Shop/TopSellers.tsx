import { formatAmount } from '~/lib/money';
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Image } from '@shopify/hydrogen';
import type { ShowcaseProduct } from '~/data/showcaseProducts';
import { useShowcaseCart } from '~/context/ShowcaseCartContext';
import { useAddToCartFeedback } from '~/hooks/useAddToCartFeedback';
import { LogoMark } from '../Common/Logo';

interface TopSellersProps {
  products: ShowcaseProduct[];
  limit?: number;
}

/**
 * Homepage "Top Sellers" shelf — replaces the old single-hero spotlight with
 * a rail of the store's actual bestselling products (Shopify's own
 * BEST_SELLING sort; see TOP_SELLERS_QUERY). Deliberately distinct from
 * ProductDiscoveryGrid further down the page: no filter tabs, since its job
 * is "these are proven favorites," not "browse the whole catalog."
 */
export function TopSellers({ products, limit = 4 }: TopSellersProps) {
  // A brand-new store has no sales history, so Shopify's BEST_SELLING sort
  // falls back to its default catalog order — which can surface an
  // out-of-stock product as a "top seller." Never feature something a
  // visitor can't actually buy.
  const inStock = products.filter((p) => p.variants.some((v) => v.inStock));

  // Once real orders accumulate, BEST_SELLING reflects genuine sales — but
  // until then, give the admin a way to pin a default featured lineup by
  // tagging products "featured" in Shopify Admin (tags already come through
  // on every product). If nothing's tagged yet, fall back to leading with
  // tumblers — the store's flagship category — rather than an arbitrary
  // catalog order.
  const isFeatured = (p: ShowcaseProduct) => (p.tags ?? []).some((t) => t.toLowerCase() === 'featured');
  const hasFeaturedTag = inStock.some(isFeatured);
  // Target handles matching the user's curated Top Sellers:
  // 1. Ribbed Water Bottle - Ivory
  // 2. Illustrated Water Bottle - Pastel Designs
  // 3. Stanley Shaker Bottle - Bright Red
  // 4. Gold-Tone Decorative Jar Trio
  const TARGET_TOP_HANDLES = [
    'ubran-essential-ribbed-water-bottle-with-carry-handle-ivory',
    'ubran-essential-illustrated-water-bottle-pastel-designs',
    'ubran-essential-water-bottle-with-carry-handle-bright-red',
    'ubran-essential-gold-tone-decorative-jar-trio',
  ];

  const targetMatched = TARGET_TOP_HANDLES
    .map((handle) => products.find((p) => p.handle === handle))
    .filter((p): p is ShowcaseProduct => p !== undefined);

  const fallbackItems = hasFeaturedTag
    ? [...inStock].sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)))
    : [...inStock].sort((a, b) => Number(b.category === 'tumbler') - Number(a.category === 'tumbler'));

  const items = targetMatched.length >= 4 ? targetMatched.slice(0, limit) : [...targetMatched, ...fallbackItems.filter(p => !targetMatched.some(t => t.id === p.id))].slice(0, limit);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !railRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = railRef.current.children;
    if (prefersReducedMotion || cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: railRef.current, start: 'top 85%', once: true },
        },
      );
    }, railRef);

    return () => ctx.revert();
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section id="top-sellers" className="relative pt-16 sm:pt-28 pb-16 sm:pb-24 px-3.5 sm:px-6 md:px-12 bg-white text-[#241a16] font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-5 mb-8 sm:mb-10 pb-5 sm:pb-6 border-b border-[#c9c2b8]">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-[#b89b6a] font-medium block">
              Most Loved
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-normal text-[#241a16] tracking-[0.02em] leading-[1.05] mt-1.5 sm:mt-2">
              Top Sellers
            </h2>
            <p className="text-xs sm:text-sm text-[#6d6560] font-light mt-2 sm:mt-3 max-w-md">
              The pieces our customers reach for again and again.
            </p>
          </div>
          <Link
            to="/collections/all"
            prefetch="intent"
            className="group inline-flex items-center gap-2 self-start md:self-auto text-xs uppercase tracking-widest font-medium text-[#241a16] hover:text-[#b89b6a] transition-colors"
          >
            View all
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-6-6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div ref={railRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {items.map((product, index) => (
            <TopSellerCard key={product.id} product={product} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TopSellerCard({ product, rank }: { product: ShowcaseProduct; rank: number }) {
  const { addItem } = useShowcaseCart();
  const defaultVariant = product.variants.find((v) => v.id === product.defaultVariantId) || product.variants[0];
  const { state: addState, trigger: handleQuickAdd } = useAddToCartFeedback(
    () => addItem(product, product.defaultVariantId, 1),
    { addedDurationMs: 2000 },
  );
  const isAdded = addState === 'added';
  const imageSrc = defaultVariant?.image || product.image;
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col rounded-2xl sm:rounded-3xl bg-white border border-[#c9c2b8] overflow-hidden shadow-[0_4px_16px_rgba(40,30,20,0.04)] hover:shadow-[0_14px_32px_rgba(40,30,20,0.1)] transition-shadow duration-300">
      <Link
        to={`/products/${product.handle}`}
        prefetch="intent"
        aria-label={product.title}
        className="relative aspect-[4/5] bg-[#161210] overflow-hidden block"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.title}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw"
            className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
            loading={rank <= 2 ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <LogoMark className="w-8 h-10 sm:w-12 sm:h-14 text-white/20" />
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest bg-[#b5402f] text-white rounded-full shadow-sm font-semibold">
            Save {discountPercent}%
          </span>
        )}
      </Link>

      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
        <div>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <Link
              to={`/products/${product.handle}`}
              prefetch="intent"
              className="text-xs sm:text-base font-medium text-[#241a16] tracking-tight hover:text-[#b89b6a] transition-colors line-clamp-1 sm:line-clamp-2 leading-snug"
            >
              {product.title}
            </Link>
            <span className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-base sm:text-xl font-serif font-bold text-[#241a16]">
                {product.currencySymbol}{formatAmount(product.price, product.currencySymbol)}
              </span>
              {hasDiscount && (
                <span className="text-xs sm:text-base font-serif font-medium text-[#a69686] line-through">
                  {product.currencySymbol}{formatAmount((product.originalPrice as number), product.currencySymbol)}
                </span>
              )}
            </span>
          </div>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={!defaultVariant?.inStock || addState !== 'idle'}
          className={`w-full py-2 px-2.5 sm:py-2.5 sm:px-4 rounded-full text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:opacity-50 ${
            isAdded ? 'bg-emerald-600 text-white' : 'bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8]'
          }`}
        >
          {isAdded ? (
            <>
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Added</span>
            </>
          ) : !defaultVariant?.inStock ? (
            <span>Out of Stock</span>
          ) : (
            <span>Add to Cart</span>
          )}
        </button>
      </div>
    </div>
  );
}
