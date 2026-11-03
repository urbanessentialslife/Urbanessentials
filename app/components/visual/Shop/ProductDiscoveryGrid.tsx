import { formatAmount } from '~/lib/money';
import React, { useEffect, useRef, useState } from 'react';
import { SwatchButton } from '~/components/visual/Product/SwatchButton';
import { Link, useLocation, useNavigate, useRouteLoaderData } from 'react-router';
import { Checkbox } from '~/components/visual/Common/Checkbox';
import { Select } from '~/components/visual/Common/Select';
import type { NavMenu } from '~/lib/navMenus';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Image } from '@shopify/hydrogen';
import { SHOWCASE_PRODUCTS, type ShowcaseProduct } from '~/data/showcaseProducts';
import { useShowcaseCart } from '~/context/ShowcaseCartContext';
import { useCompare } from '~/context/CompareContext';
import { useWishlist } from '~/context/WishlistContext';
import { useAddToCartFeedback } from '~/hooks/useAddToCartFeedback';
import { ProductQuickView } from '../Product/ProductQuickView';
import { LogoMark } from '../Common/Logo';
import { BlobAccent } from '../Common/BlobAccent';

type SortKey = 'featured' | 'price-asc' | 'price-desc';
/** Swatches shown before "+N more" — the full list is dozens of near-identical dots. */
const MAX_COLOR_SWATCHES = 8;

interface ProductDiscoveryGridProps {
  /** The live Shopify catalog (real price/variant IDs); falls back to the local mock. */
  products?: ShowcaseProduct[];
  eyebrow?: string;
  heading?: string;
  /** Set false when a page-level header already renders its own title above this grid. */
  showHeading?: boolean;
  /** The color filter only makes sense where someone is actively browsing the full catalog (Shop/collection pages) — off by default on a homepage teaser. */
  showColorFilter?: boolean;
  /** Caps the visible cards (e.g. a homepage teaser) — a "Browse More" button covers the rest. */
  limit?: number;
  browseMoreHref?: string;
  browseMoreLabel?: string;
  /** Shop / collection pages: category + filter side panel and a sort control, instead of the inline tabs. */
  sidebar?: boolean;
}

export function ProductDiscoveryGrid({
  products = SHOWCASE_PRODUCTS,
  eyebrow = 'Curated Heirlooms',
  heading = 'Featured Gifts',
  showHeading = true,
  showColorFilter = true,
  limit,
  browseMoreHref,
  browseMoreLabel = 'Browse More',
  sidebar = false,
}: ProductDiscoveryGridProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'tumbler' | 'bottle' | 'mug' | 'gift-set'>('all');
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<ShowcaseProduct | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('featured');
  const [showAllColors, setShowAllColors] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const rootData = useRouteLoaderData('root') as {
    categories?: { handle: string; title: string }[];
    navMenus?: NavMenu[];
  } | undefined;
  const categoryLabel = (handle: string) =>
    rootData?.categories?.find((c) => c.handle === handle)?.title ??
    (rootData?.navMenus ?? []).flatMap((m) => m.items).find((i) => i.to.split('?')[0].endsWith(`/${handle}`))?.label ??
    handle.replace(/-/g, ' ');

  // Distinct colors across the whole catalog passed in, not just the
  // category-filtered subset — so the swatch row doesn't reshuffle or lose
  // options as someone switches category tabs.
  const availableColors = Array.from(
    products
      .flatMap((product) => product.variants)
      .reduce((map, variant) => {
        if (!map.has(variant.colorHex)) map.set(variant.colorHex, variant.colorName || variant.name);
        return map;
      }, new Map<string, string>())
      .entries(),
  ).map(([hex, name]) => ({ hex, name }));

  const toggleColor = (hex: string) => {
    setActiveColors((prev) => (prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]));
  };

  const filteredProducts = products.filter((product) => {
    if (activeFilter !== 'all' && product.category !== activeFilter) return false;
    if (activeCategories.length > 0 && !(product.collectionHandles ?? []).some((h) => activeCategories.includes(h))) return false;
    if (activeColors.length > 0 && !product.variants.some((v) => activeColors.includes(v.colorHex))) {
      return false;
    }
    return true;
  });

  // Stagger/interleave items on 'all' tab so cards show diverse categories rather than identical color models
  const diverseCatalog = (list: ShowcaseProduct[]) => {
    if (activeFilter !== 'all') return list;
    const byCategory: Record<string, ShowcaseProduct[]> = {};
    for (const p of list) {
      const cat = p.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    }
    const catKeys = ['tumbler', 'bottle', 'mug', 'gift-set', 'lifestyle'];
    const result: ShowcaseProduct[] = [];
    let added = true;
    let i = 0;
    while (added) {
      added = false;
      for (const k of catKeys) {
        if (byCategory[k] && i < byCategory[k].length) {
          result.push(byCategory[k][i]);
          added = true;
        }
      }
      i++;
    }
    for (const p of list) {
      if (!result.includes(p)) result.push(p);
    }
    return result;
  };

  const sortedProducts =
    sort === 'featured'
      ? diverseCatalog(filteredProducts)
      : [...filteredProducts].sort((a, b) => (sort === 'price-asc' ? a.price - b.price : b.price - a.price));
  const displayedProducts = typeof limit === 'number' ? sortedProducts.slice(0, limit) : sortedProducts;
  const visibleColors = showAllColors ? availableColors : availableColors.slice(0, MAX_COLOR_SWATCHES);
  const hasMore = displayedProducts.length < filteredProducts.length;

  // Stagger the cards in once, the first time the grid scrolls into view.
  // Deliberately mount-only (no filter dependency) — this used to re-run on
  // every filter/color click too, which recreated the ScrollTrigger on an
  // already-visible grid and replayed the full 0.8s fade/scale/slide-in on
  // every single click, making a simple filter toggle look like the whole
  // section was reloading from scratch.
  useEffect(() => {
    if (typeof window === 'undefined' || !gridRef.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = gridRef.current.children;
    if (prefersReducedMotion || cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 56, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            once: true,
          },
        },
      );
    }, gridRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A quick, un-gated fade for the card set actually changing under a
  // filter — instant feedback, not a scroll-triggered "reveal." Skips the
  // very first render so it doesn't double up with the entrance effect
  // above.
  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    if (typeof window === 'undefined' || !gridRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = gridRef.current.children;
    if (prefersReducedMotion || cards.length === 0) return;

    gsap.fromTo(
      cards,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, stagger: 0.025, ease: 'power1.out' },
    );
  }, [activeFilter, activeColors, activeCategories, sort]);

  const typeTabs: { key: 'all' | 'tumbler' | 'bottle' | 'mug' | 'gift-set'; label: string }[] = [
    { key: 'all', label: `All Pieces (${products.length})` },
    { key: 'tumbler', label: 'Tumblers' },
    { key: 'bottle', label: 'Water Bottles' },
    { key: 'mug', label: 'Mugs & Cups' },
    { key: 'gift-set', label: 'Curated Sets' },
  ];

  const colorFilter =
    showColorFilter && availableColors.length > 1 ? (
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          {visibleColors.map(({ hex, name }) => (
            <SwatchButton
              key={hex}
              color={hex}
              selected={activeColors.includes(hex)}
              title={name}
              onClick={() => toggleColor(hex)}
              size={24}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          {availableColors.length > MAX_COLOR_SWATCHES && (
            <button
              type="button"
              onClick={() => setShowAllColors((v) => !v)}
              className="text-[11px] uppercase tracking-widest text-[#6d6560] hover:text-[#241a16] font-medium underline underline-offset-2 cursor-pointer"
            >
              {showAllColors ? 'Show fewer' : `+${availableColors.length - MAX_COLOR_SWATCHES} more`}
            </button>
          )}
          {activeColors.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveColors([])}
              className="text-[11px] uppercase tracking-widest text-[#6d6560] hover:text-[#241a16] font-medium underline underline-offset-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    ) : null;

  const emptyState = (
    <div className="text-center py-16">
      <p className="text-sm text-[#6d6560] mb-4">No pieces match these filters just yet.</p>
      {(activeFilter !== 'all' || activeColors.length > 0 || activeCategories.length > 0) && (
        <button
          onClick={() => {
            setActiveFilter('all');
            setActiveColors([]);
            setActiveCategories([]);
          }}
          className="px-6 py-2.5 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200 cursor-pointer"
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  const cardGrid =
    displayedProducts.length > 0 ? (
      <>
        <div
          ref={gridRef}
          className={`grid grid-cols-2 gap-3 sm:gap-6 md:gap-10 ${
            sidebar ? 'xl:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              activeColors={activeColors}
              onQuickView={() => setQuickViewProduct(product)}
            />
          ))}
        </div>
        {hasMore && browseMoreHref && (
          <div className="flex justify-center mt-12">
            <Link
              to={browseMoreHref}
              prefetch="intent"
              className="inline-flex items-center space-x-2 px-8 py-3 rounded-full border border-[#241a16] text-[#241a16] hover:bg-[#241a16] hover:text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200 group"
            >
              <span>{browseMoreLabel}</span>
              <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </>
    ) : (
      emptyState
    );

  const sectionCls = `px-3.5 sm:px-6 md:px-12 bg-white text-[#241a16] font-sans ${
    showHeading ? 'py-16 sm:py-24 border-t border-[#e2ddd5]' : 'pt-2 pb-16 sm:pb-24'
  }`;

  if (sidebar) {
    const toggleCategory = (handle: string) =>
      setActiveCategories((prev) => (prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle]));
    const typeCount = (key: 'tumbler' | 'gift-set' | 'bottle' | 'mug') => products.filter((p) => p.category === key).length;
    const activeCount = activeCategories.length + activeColors.length + (activeFilter !== 'all' ? 1 : 0);
    const clearAll = () => {
      setActiveCategories([]);
      setActiveColors([]);
      setActiveFilter('all');
    };

    const filterBody = (
      <div className="space-y-9">
        <ShopCategoryList products={products} selected={activeCategories} onToggle={toggleCategory} />
        <FilterGroup title="Type">
          <div className="space-y-2.5">
            <Checkbox
              label="Tumblers"
              count={typeCount('tumbler')}
              checked={activeFilter === 'tumbler'}
              onChange={(on) => setActiveFilter(on ? 'tumbler' : 'all')}
            />
            <Checkbox
              label="Water Bottles"
              count={typeCount('bottle')}
              checked={activeFilter === 'bottle'}
              onChange={(on) => setActiveFilter(on ? 'bottle' : 'all')}
            />
            <Checkbox
              label="Mugs & Cups"
              count={typeCount('mug')}
              checked={activeFilter === 'mug'}
              onChange={(on) => setActiveFilter(on ? 'mug' : 'all')}
            />
            <Checkbox
              label="Curated Sets"
              count={typeCount('gift-set')}
              checked={activeFilter === 'gift-set'}
              onChange={(on) => setActiveFilter(on ? 'gift-set' : 'all')}
            />
          </div>
        </FilterGroup>
        {colorFilter && <FilterGroup title="Colour">{colorFilter}</FilterGroup>}
      </div>
    );

    const chips: { key: string; label: string; remove: () => void }[] = [
      ...activeCategories.map((h) => ({ key: `c-${h}`, label: categoryLabel(h), remove: () => toggleCategory(h) })),
      ...(activeFilter !== 'all'
        ? [{
            key: 'type',
            label:
              activeFilter === 'tumbler'
                ? 'Tumblers'
                : activeFilter === 'bottle'
                  ? 'Water Bottles'
                  : activeFilter === 'mug'
                    ? 'Mugs & Cups'
                    : 'Curated Sets',
            remove: () => setActiveFilter('all'),
          }]
        : []),
      ...activeColors.map((hex) => ({
        key: `col-${hex}`,
        label: availableColors.find((c) => c.hex === hex)?.name ?? 'Colour',
        remove: () => toggleColor(hex),
      })),
    ];

    return (
      <section id="product-grid" className={sectionCls}>
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12 xl:gap-14">
            {/* A <div>, not <aside>: the leftover skeleton stylesheet gives every <aside> position:fixed. */}
            <div role="complementary" aria-label="Categories and filters" className="hidden lg:block">
              <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">{filterBody}</div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[#c9c2b8]">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                    aria-expanded={filtersOpen}
                    className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#241a16] text-[#241a16] text-xs uppercase tracking-widest font-medium cursor-pointer"
                  >
                    Filters
                    {activeCount > 0 && (
                      <span className="font-num text-[10px] bg-[#241a16] text-[#f4f0e8] rounded-full w-4 h-4 inline-flex items-center justify-center">
                        {activeCount}
                      </span>
                    )}
                  </button>
                  <span className="text-xs uppercase tracking-widest text-[#6d6560]">
                    <span className="font-num">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'piece' : 'pieces'}
                  </span>
                </div>
                <Select
                  label="Sort"
                  showLabel
                  value={sort}
                  onChange={(v) => setSort(v as SortKey)}
                  options={[
                    { value: 'featured', label: 'Featured' },
                    { value: 'price-asc', label: 'Price: Low to High' },
                    { value: 'price-desc', label: 'Price: High to Low' },
                  ]}
                />
              </div>

              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  {chips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={chip.remove}
                      aria-label={`Remove filter ${chip.label}`}
                      className="group inline-flex items-center gap-2 rounded-full border border-[#241a16] bg-[#241a16] px-3.5 py-1.5 text-[11px] uppercase tracking-widest text-[#f4f0e8] cursor-pointer transition-colors hover:bg-transparent hover:text-[#241a16]"
                    >
                      {chip.label}
                      <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <path d="M2 2l6 6M8 2l-6 6" />
                      </svg>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={clearAll}
                    className="ml-1 text-[11px] uppercase tracking-widest text-[#6d6560] hover:text-[#241a16] underline underline-offset-4 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {filtersOpen && <div className="lg:hidden mb-8 p-5 rounded-2xl bg-white border border-[#c9c2b8]">{filterBody}</div>}

              {cardGrid}
            </div>
          </div>
        </div>

        {quickViewProduct && (
          <ProductQuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
        )}
      </section>
    );
  }

  return (
    <section id="product-grid" className={sectionCls}>
      <div className="max-w-7xl mx-auto">
        <div className="relative flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#c9c2b8] gap-6">
          {showHeading ? (
            <div className="relative">
              <BlobAccent color="#b89b6a" className="w-56 h-56 -top-16 -left-10" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-[#b89b6a] font-medium block">
                {eyebrow}
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-[#241a16] tracking-[0.02em] leading-[1.05] mt-2">
                {heading}
              </h2>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1 sm:gap-2 bg-neutral-100 p-1.5 rounded-full border border-[#e2ddd5] self-start md:self-auto overflow-x-auto max-w-full scrollbar-none">
            {typeTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeFilter === tab.key
                    ? 'bg-[#241a16] text-white font-semibold shadow-sm'
                    : 'text-[#6d6560] hover:text-[#241a16]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {colorFilter && (
          <div className="flex items-start gap-4 mb-10 -mt-2">
            <span className="text-[11px] uppercase tracking-widest text-[#6d6560] font-medium mt-1.5">Colour</span>
            {colorFilter}
          </div>
        )}

        {cardGrid}
      </div>

      {quickViewProduct && (
        <ProductQuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </section>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.22em] text-[#b89b6a] font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Category tree for the shop sidebar — the same Shopify-driven menu the
 * header uses, as checkboxes. On the shop-all page they filter the grid in
 * place (products carry their collection handles); on a collection page the
 * grid is already that collection, so ticking another category navigates to it.
 */
function ShopCategoryList({
  products,
  selected,
  onToggle,
}: {
  products: ShowcaseProduct[];
  selected: string[];
  onToggle: (handle: string) => void;
}) {
  const root = useRouteLoaderData('root') as {
    categories?: { handle: string; title: string }[];
    navMenus?: NavMenu[];
  } | undefined;
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Prefer actual Shopify collections configured in the store's backend
  const liveCategories = root?.categories ?? [];
  const filterMode = products.some((p) => p.collectionHandles !== undefined);
  const countFor = (handle: string) => products.filter((p) => p.collectionHandles?.includes(handle)).length;

  // Filter collections that actually have products (or display all real store collections)
  const activeStoreCollections = liveCategories
    .map((c) => ({
      label: c.title,
      handle: c.handle,
      to: `/collections/${c.handle}`,
      count: filterMode ? countFor(c.handle) : undefined,
    }))
    .filter((c) => !filterMode || (c.count ?? 0) > 0);

  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.22em] text-[#b89b6a] font-semibold mb-4">Categories</h3>
      {!filterMode && (
        <Link to="/collections/all" prefetch="intent" className="mb-4 block text-sm text-[#6d6560] hover:text-[#241a16] transition-colors">
          ← All products
        </Link>
      )}
      <div className="space-y-3">
        <ul className="space-y-2.5">
          {activeStoreCollections.map((col) => (
            <li key={col.handle}>
              <Checkbox
                label={col.label}
                count={col.count}
                checked={filterMode ? selected.includes(col.handle) : pathname === col.to}
                onChange={(on) => {
                  if (filterMode) onToggle(col.handle);
                  else void navigate(on ? col.to : '/collections/all');
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: ShowcaseProduct;
  /** When a color filter is active and this product has a variant in that color, show that specific variant's image instead of the default one — a product filtered to "green" should actually show green. */
  activeColors?: string[];
  onQuickView: () => void;
}

function ProductCard({ product, activeColors = [], onQuickView }: ProductCardProps) {
  const { addItem } = useShowcaseCart();
  const { isCompared, toggleCompare } = useCompare();
  const isInCompare = isCompared(product.id);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const isSaved = isWishlisted(product.id);
  const defaultVariant = product.variants.find((v) => v.id === product.defaultVariantId) || product.variants[0];
  const filterMatchedVariant =
    activeColors.length > 0 ? product.variants.find((v) => activeColors.includes(v.colorHex)) : undefined;
  const displayVariant = filterMatchedVariant ?? defaultVariant;
  const { state: addState, trigger: handleQuickAdd } = useAddToCartFeedback(
    () => addItem(product, displayVariant.id, 1),
    { addedDurationMs: 2000 },
  );
  const isAdded = addState === 'added';
  const imageSrc = displayVariant.image || product.image;
  // A merchant-set compareAtPrice (Shopify Admin → Discounts, or just a
  // higher "compare at" on the variant) is already resolved onto
  // originalPrice by showcaseCommerce.ts — surface it as a visible discount
  // rather than silently dropping it, so an admin discount is actually
  // noticeable on the storefront.
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;

  return (
    <div className="group flex flex-col rounded-2xl sm:rounded-3xl bg-white border border-[#c9c2b8] overflow-hidden transition-shadow duration-300 shadow-[0_4px_16px_rgba(40,30,20,0.04)] hover:shadow-[0_14px_32px_rgba(40,30,20,0.1)]">
      {/* Visual Area — clicking the image goes straight to the full product
          page, like any normal storefront; Quick View is a distinct, small
          secondary trigger in the corner rather than the main click target. */}
      <div className="relative aspect-[4/5] bg-[#161210] overflow-hidden w-full">
        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          aria-label={product.title}
          // A plain opaque photo covers this edge-to-edge regardless of background,
          // but a couple of products only have a transparent hero cutout to show
          // here — those need a dark backdrop or their pale finish disappears
          // against a light card.
          className="absolute inset-0 block"
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.title}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 50vw"
              className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            // An admin-added product with no photo at all — a plain empty dark
            // card reads as broken, so show the brand mark instead.
            <div className="w-full h-full flex items-center justify-center">
              <LogoMark className="w-8 h-10 sm:w-12 sm:h-14 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-[#241a16]/0 group-hover:bg-[#241a16]/10 transition-colors duration-300" />
        </Link>

        {/* Discount badge only — a second stacked badge (e.g. a "Bestseller"
            label) read as cluttered info next to the price cut, so the
            discount is the one callout this corner makes. */}
        {hasDiscount && (
          <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 pointer-events-none">
            <span className="px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest bg-[#b5402f] text-white rounded-full shadow-sm font-semibold">
              Save {discountPercent}%
            </span>
          </div>
        )}

        {/* Wishlist — always visible (not hover-gated like the two below),
            the one save affordance a visitor expects to find without first
            discovering it via hover. */}
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={isSaved ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          aria-pressed={isSaved}
          className={`absolute top-2.5 right-2.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-9 sm:h-9 rounded-full backdrop-blur-md border shadow-sm flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isSaved ? 'bg-[#b5402f] border-[#b5402f]' : 'bg-white/90 hover:bg-white border-[#c9c2b8]'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'text-white' : 'text-[#241a16]'}`}
            fill={isSaved ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Quick View — hidden on mobile to maximize photo tap area and avoid accidental mis-taps */}
        <button
          type="button"
          onClick={onQuickView}
          aria-label={`Quick view ${product.title}`}
          className="hidden sm:flex absolute top-16 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-[#c9c2b8] shadow-sm items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <svg className="w-4 h-4 text-[#241a16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.437 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Compare Toggle — hidden on mobile */}
        <button
          type="button"
          onClick={() => toggleCompare(product)}
          aria-label={isInCompare ? `Remove ${product.title} from comparison` : `Add ${product.title} to comparison`}
          aria-pressed={isInCompare}
          className={`hidden sm:flex absolute top-28 right-4 w-9 h-9 rounded-full backdrop-blur-md border shadow-sm items-center justify-center cursor-pointer transition-all duration-300 ${
            isInCompare
              ? 'bg-[#241a16] border-[#241a16] opacity-100'
              : 'bg-white/90 hover:bg-white border-[#c9c2b8] opacity-0 group-hover:opacity-100'
          }`}
        >
          <svg
            className={`w-4 h-4 ${isInCompare ? 'text-[#dfc08a]' : 'text-[#241a16]'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h11M3 7a2 2 0 002 2h7a2 2 0 002-2M3 7a2 2 0 012-2h7a2 2 0 012 2m3 10H10m10 0a2 2 0 01-2 2h-7a2 2 0 01-2-2m11 0a2 2 0 00-2-2h-7a2 2 0 00-2 2" />
          </svg>
        </button>

        {/* Color Swatch Dots — hidden on small screens */}
        <div className="hidden sm:flex absolute bottom-4 left-4 items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#c9c2b8] shadow-sm pointer-events-none">
          {product.variants.slice(0, 5).map((v) => (
            <span
              key={v.id}
              className="w-2.5 h-2.5 rounded-full border border-[#c9c2b8] shrink-0"
              style={{ backgroundColor: v.colorHex }}
              title={v.name}
            />
          ))}
          <span className="text-[10px] text-[#6d6560] pl-0.5 uppercase tracking-wider font-medium whitespace-nowrap">
            {product.variants.length} {product.variants.length === 1 ? 'Finish' : 'Finishes'}
          </span>
        </div>
      </div>

      {/* Card Content Area — Clean & Minimal */}
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
          <span className="text-[10px] sm:text-[11px] text-[#6d6560] font-light mt-0.5 block line-clamp-1">
            {product.category === 'tumbler'
              ? 'Everyday Tumbler'
              : product.category === 'gift-set'
                ? 'Curated Gift Set'
                : product.category === 'bottle'
                  ? 'Water Bottle'
                  : product.category === 'mug'
                    ? 'Travel Mug & Cup'
                    : 'Lifestyle'}
          </span>
        </div>

        {/* Actions — customizable products need the name field in Quick
            View, so their card CTA opens that instead of instant-adding.
            Quick View lets the visitor switch to an in-stock finish, so it
            stays open-able even when the default variant itself is out of
            stock; only the instant "Add to Cart" path needs the stock guard. */}
        <button
          onClick={product.customization?.enabled ? onQuickView : handleQuickAdd}
          disabled={(!product.customization?.enabled && !displayVariant.inStock) || addState !== 'idle'}
          className={`w-full py-2 px-2.5 sm:py-2.5 sm:px-4 rounded-full text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:opacity-50 ${
            isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8]'
          }`}
        >
          {isAdded ? (
            <>
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Added</span>
            </>
          ) : product.customization?.enabled ? (
            <span>Customize</span>
          ) : !displayVariant.inStock ? (
            <span>Out of Stock</span>
          ) : (
            <span>Add to Cart</span>
          )}
        </button>
      </div>
    </div>
  );
}
