import { formatAmount } from '~/lib/money';
import React, { useEffect, useRef, useState } from 'react';
import { SwatchButton } from './SwatchButton';
import { gsap } from 'gsap';
import { Image } from '@shopify/hydrogen';
import type { ShowcaseProduct, ProductVariant } from '~/data/showcaseProducts';
import { useShowcaseCart } from '~/context/ShowcaseCartContext';
import { useWishlist } from '~/context/WishlistContext';
import { useAddToCartFeedback } from '~/hooks/useAddToCartFeedback';
import { useDialogTransition } from '~/hooks/useDialogTransition';
import { LogoMark } from '~/components/visual/Common/Logo';
import { NotifyWhenAvailable } from '~/components/visual/Product/NotifyWhenAvailable';

interface ProductQuickViewProps {
  product: ShowcaseProduct;
  onClose: () => void;
}

export function ProductQuickView({ product, onClose }: ProductQuickViewProps) {
  const { addItem } = useShowcaseCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const isSaved = isWishlisted(product.id);
  const dialogRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [activeVariant, setActiveVariant] = useState<ProductVariant>(
    () => product.variants.find((v) => v.id === product.defaultVariantId) || product.variants[0],
  );
  const [customName, setCustomName] = useState('');

  const { handleClose } = useDialogTransition(dialogRef, onClose, {
    enterFrom: { opacity: 0, scale: 0.92, y: 30 },
    isOpen: true,
  });

  const { state: addState, trigger: handleAddToCart } = useAddToCartFeedback(
    () => addItem(product, activeVariant.id, 1, customName.trim() || undefined),
    { addedDurationMs: 2200 },
  );

  // Focus management + Escape-to-close, matching the site's other dialogs.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      // preventScroll matters here — restoring focus to the tile that
      // opened this dialog would otherwise let the browser's default
      // focus-scroll nudge the page out from under the visitor.
      previouslyFocused?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Staggered reveal of the detail column, once the dialog itself has entered.
  useEffect(() => {
    if (!detailRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        Array.from(detailRef.current!.children),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, delay: 0.2, ease: 'power2.out' },
      );
    });

    return () => ctx.revert();
  }, []);

  const isAdded = addState === 'added';
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} quick view`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241a16]/70 backdrop-blur-md p-4 sm:p-8"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#f4f0e8] rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2">
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
        >
          <svg className="w-4 h-4 text-[#241a16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={isSaved ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          aria-pressed={isSaved}
          className={`absolute top-4 right-16 z-10 w-9 h-9 rounded-full backdrop-blur-md border shadow-sm flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isSaved ? 'bg-[#b5402f] border-[#b5402f]' : 'bg-white/90 hover:bg-white border-[#c9c2b8]'
          }`}
        >
          <svg
            className={`w-4 h-4 ${isSaved ? 'text-white' : 'text-[#241a16]'}`}
            fill={isSaved ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative aspect-square md:aspect-auto bg-[#e8e1d4] md:min-h-[420px]">
          {activeVariant.image || product.image ? (
            <Image
              src={activeVariant.image || product.image}
              alt={`${product.title} — ${activeVariant.name}`}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <LogoMark className="w-16 h-20 text-[#241a16]/15" />
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#b5402f] text-white text-[10px] uppercase tracking-widest font-semibold">
              Save {discountPercent}%
            </span>
          )}
        </div>

        {/* Details */}
        <div ref={detailRef} className="p-6 md:p-8 flex flex-col justify-center space-y-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            {product.tagline}
          </span>
          <h3 className="text-2xl md:text-3xl font-serif font-light text-[#241a16] leading-tight">
            {product.title}
          </h3>
          <p className="text-sm text-[#6d6560] leading-relaxed">{product.description}</p>

          <ul className="space-y-1.5 text-xs text-[#3a2c24]">
            {product.details.slice(0, 4).map((detail) => (
              <li key={detail} className="flex items-start space-x-2">
                <span className="w-1 h-1 rounded-full bg-[#b89b6a] mt-1.5 shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline space-x-3 pt-1">
            <span className="text-4xl font-serif font-bold text-[#241a16]">
              {product.currencySymbol}{formatAmount(product.price, product.currencySymbol)}
            </span>
            {hasDiscount && (
              <span className="text-lg font-serif font-medium text-[#a69686] line-through">
                {product.currencySymbol}{formatAmount((product.originalPrice as number), product.currencySymbol)}
              </span>
            )}
          </div>

          {product.variants.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-widest text-[#6d6560]">
                Finish: <span className="text-[#241a16] font-semibold">{activeVariant.name}</span>
              </span>
              <div className="flex items-center flex-wrap gap-1 -ml-1.5">
                {product.variants.map((v) => (
                  <SwatchButton
                    key={v.id}
                    color={v.colorHex}
                    selected={activeVariant.id === v.id}
                    disabled={!v.inStock}
                    title={`${v.name}${v.inStock ? '' : ' (Out of stock)'}`}
                    onClick={() => setActiveVariant(v)}
                    size={24}
                  />
                ))}
              </div>
            </div>
          )}

          {product.customization?.enabled && (
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="quickview-custom-name"
                className="text-xs uppercase tracking-widest text-[#6d6560] flex items-center justify-between"
              >
                <span>Customize with a name</span>
                <span className="text-xs text-[#6d6560] normal-case font-serif font-semibold">
                  +{product.currencySymbol}
                  {formatAmount(product.customization.feeAmount, product.currencySymbol)}
                </span>
              </label>
              <input
                id="quickview-custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Priya"
                maxLength={40}
                className="w-full text-sm bg-white border border-[#c9c2b8] rounded-xl px-3 py-2.5 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition"
              />
              {product.customization.shippingDays > 0 && (
                <p className="text-[10px] text-[#6d6560] uppercase tracking-wider font-medium">
                  Customized items ship in +{product.customization.shippingDays} days
                </p>
              )}
            </div>
          )}

          {activeVariant.inStock ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addState !== 'idle'}
              className={`w-full py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                isAdded ? 'bg-emerald-600 text-white' : 'bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8]'
              }`}
            >
              {isAdded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added to Cart</span>
                </>
              ) : (
                <span>Add to Cart</span>
              )}
            </button>
          ) : (
            <NotifyWhenAvailable productLabel={`${product.title} — ${activeVariant.name}`} />
          )}
        </div>
      </div>
    </div>
  );
}
