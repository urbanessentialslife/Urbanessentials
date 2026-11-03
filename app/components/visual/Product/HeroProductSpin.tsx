import { formatAmount } from '~/lib/money';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SwatchButton } from './SwatchButton';
import { Link } from 'react-router';
import { gsap } from 'gsap';
import { Image } from '@shopify/hydrogen';
import type { ShowcaseProduct, ProductVariant } from '~/data/showcaseProducts';
import { useShowcaseCart } from '~/context/ShowcaseCartContext';
import { useAddToCartFeedback } from '~/hooks/useAddToCartFeedback';

interface HeroProductSpinProps {
  product: ShowcaseProduct;
  features: string[];
  variants: ProductVariant[];
  activeVariant: ProductVariant;
  onVariantChange: (variant: ProductVariant) => void;
  /** The clicked product image's on-page position, captured at click time. */
  sourceRect: DOMRect;
  onClose: () => void;
}

const ROTATE_RANGE = 18; // degrees either side of center
const SCROLL_DISTANCE = 260; // px of accumulated wheel/touch delta for a full 0->1 sweep
const CLOSE_THRESHOLD = -0.12; // scrolling back past this dismisses the stage

/**
 * Click "extracts" the product straight out of the page — a FLIP move from
 * its exact on-page rect to a centered, isolated stage, no rotation, just
 * position/scale (the "3D pop" reads through a soft elevation + glow, not a
 * spin). Once it has landed, further scroll (wheel or touch) is what turns
 * the product in place and reveals its detail copy a piece at a time —
 * scrolling back out past the start returns it to where it came from.
 */
export function HeroProductSpin({
  product,
  features,
  variants,
  activeVariant,
  onVariantChange,
  sourceRect,
  onClose,
}: HeroProductSpinProps) {
  const { addItem } = useShowcaseCart();
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const closingRef = useRef(false);

  const { state: addState, trigger: handleAddToCart } = useAddToCartFeedback(
    () => addItem(product, activeVariant.id, 1),
    { addedDurationMs: 2200 },
  );

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;

    const prefersReducedMotion = reducedMotionRef.current;
    if (prefersReducedMotion || !stageRef.current || !rootRef.current) {
      onClose();
      return;
    }

    gsap.to(backdropRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    // Return the product to exactly where it came from.
    const dest = stageRef.current.getBoundingClientRect();
    const dx = sourceRect.left + sourceRect.width / 2 - (dest.left + dest.width / 2);
    const dy = sourceRect.top + sourceRect.height / 2 - (dest.top + dest.height / 2);
    const scaleX = sourceRect.width / dest.width;
    const scaleY = sourceRect.height / dest.height;
    gsap.to(stageRef.current, {
      x: dx,
      y: dy,
      scaleX,
      scaleY,
      rotationY: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: onClose,
    });
  };

  // The FLIP entrance: land the product exactly where the click found it,
  // then animate it out to its centered stage position — pure position and
  // scale, deliberately no rotation here.
  useLayoutEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotionRef.current || !stageRef.current) {
      setProgress(1);
      progressRef.current = 1;
      return;
    }

    const dest = stageRef.current.getBoundingClientRect();
    const dx = sourceRect.left + sourceRect.width / 2 - (dest.left + dest.width / 2);
    const dy = sourceRect.top + sourceRect.height / 2 - (dest.top + dest.height / 2);
    const scaleX = sourceRect.width / dest.width;
    const scaleY = sourceRect.height / dest.height;

    gsap.set(stageRef.current, { x: dx, y: dy, scaleX, scaleY, rotationY: 0 });
    gsap.to(stageRef.current, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'power3.out' });
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo(glowRef.current, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.7, delay: 0.15, ease: 'power2.out' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll (wheel or touch) drives progress — a full 0->1 sweep, or back out
  // past the start to dismiss the stage entirely.
  useEffect(() => {
    if (reducedMotionRef.current) return;
    document.body.style.overflow = 'hidden';

    const applyDelta = (delta: number) => {
      const next = Math.min(1.05, progressRef.current + delta / SCROLL_DISTANCE);
      progressRef.current = next;
      if (next <= CLOSE_THRESHOLD) {
        handleClose();
        return;
      }
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setProgress(Math.min(1, Math.max(0, progressRef.current)));
        rafRef.current = null;
      });
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyDelta(e.deltaY);
    };

    let lastTouchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (lastTouchY === null) return;
      e.preventDefault();
      const currentY = e.touches[0]?.clientY ?? lastTouchY;
      applyDelta(lastTouchY - currentY);
      lastTouchY = currentY;
    };

    const el = rootRef.current;
    el?.addEventListener('wheel', onWheel, { passive: false });
    el?.addEventListener('touchstart', onTouchStart, { passive: true });
    el?.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = '';
      el?.removeEventListener('wheel', onWheel);
      el?.removeEventListener('touchstart', onTouchStart);
      el?.removeEventListener('touchmove', onTouchMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress drives the in-place turn — applied imperatively via GSAP so it
  // composes cleanly with the FLIP transform already on the same element.
  useEffect(() => {
    if (reducedMotionRef.current || !stageRef.current) return;
    gsap.set(stageRef.current, { rotationY: -ROTATE_RANGE + progress * ROTATE_RANGE * 2 });
  }, [progress]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reveal = (threshold: number, span = 0.14) => {
    const p = Math.min(1, Math.max(0, (progress - threshold) / span));
    return { opacity: p, transform: `translateY(${(1 - p) * 14}px)` };
  };

  const isAdded = addState === 'added';

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} spotlight`}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      <div
        ref={backdropRef}
        role="button"
        tabIndex={0}
        aria-label="Dismiss spotlight"
        className="absolute inset-0 bg-[#0d0705]/97 cursor-default"
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClose();
        }}
      />

      <button
        ref={closeButtonRef}
        onClick={handleClose}
        aria-label="Close spotlight"
        className="fixed top-5 right-5 sm:top-8 sm:right-8 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shadow-sm cursor-pointer transition-colors"
      >
        <svg className="w-4 h-4 text-[#f4f0e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div ref={glowRef} aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(184,155,106,0.22), transparent 70%)' }} />

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6" style={{ perspective: 1400 }}>
        <div
          ref={stageRef}
          className="w-52 h-64 sm:w-64 sm:h-80 will-change-transform"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {activeVariant.video ? (
            <video
              key={activeVariant.id}
              src={activeVariant.video}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover rounded-[1.75rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
            />
          ) : (
            <Image
              src={activeVariant.image || product.image}
              alt={`${product.title} — ${activeVariant.name}`}
              sizes="256px"
              className="w-full h-full object-cover rounded-[1.75rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
            />
          )}
        </div>

        <div className="relative mt-10 flex flex-col items-center text-center space-y-5 max-w-md">
          <span style={reveal(0)} className="text-[10px] uppercase tracking-[0.35em] text-[#b89b6a] font-semibold">
            {product.tagline}
          </span>
          <h3 style={reveal(0)} className="text-3xl sm:text-4xl font-serif font-light text-[#f4f0e8] leading-tight">
            {product.title}
          </h3>

          <ul className="space-y-2 text-sm text-[#d9d2c6] font-light">
            {features.map((feature, i) => (
              <li key={feature} style={reveal(0.12 + i * 0.14)} className="flex items-start space-x-2.5 text-left">
                <svg className="w-4 h-4 mt-0.5 text-[#b89b6a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div style={reveal(0.72)} className="flex items-baseline space-x-3">
            <span className="text-3xl font-serif font-semibold text-[#f4f0e8]">
              {product.currencySymbol}{formatAmount(product.price, product.currencySymbol)}
            </span>
            {product.originalPrice && (
              <span className="text-lg font-serif font-medium text-[#a69686] line-through">
                {product.currencySymbol}{formatAmount(product.originalPrice, product.currencySymbol)}
              </span>
            )}
          </div>

          <div style={reveal(0.82)} className="flex items-center space-x-0.5 -ml-1.5">
            {variants.map((variant) => {
              const isActive = activeVariant.id === variant.id;
              return (
                <SwatchButton
                  key={variant.id}
                  color={variant.colorHex}
                  selected={isActive}
                  disabled={!variant.inStock}
                  title={`${variant.name} (${variant.colorName})${variant.inStock ? '' : ' — Out of stock'}`}
                  onClick={() => onVariantChange(variant)}
                  size={24}
                  activeRingClass="ring-2 ring-[#f4f0e8]"
                />
              );
            })}
          </div>

          {product.customization?.enabled ? (
            // Personalization needs a name field this close-up spin stage
            // has no room for — send them to the full PDP for that instead
            // of instant-adding with no name.
            <Link
              to={`/products/${product.handle}`}
              style={reveal(0.9)}
              className="mt-2 px-8 py-4 rounded-xl text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-md bg-[#b89b6a] hover:bg-[#cbb187] text-[#241a16]"
            >
              <span>Personalize &amp; Add</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!activeVariant.inStock || addState !== 'idle'}
              style={reveal(0.9)}
              className={`mt-2 px-8 py-4 rounded-xl text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${
                isAdded ? 'bg-emerald-600 text-white' : 'bg-[#b89b6a] hover:bg-[#cbb187] text-[#241a16]'
              }`}
            >
              {isAdded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added to Cart</span>
                </>
              ) : !activeVariant.inStock ? (
                <span>Out of Stock</span>
              ) : (
                <span>Add to Cart</span>
              )}
            </button>
          )}
        </div>

        {progress < 0.85 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1.5" style={{ opacity: 1 - progress }}>
            <div className="w-4 h-7 rounded-full border border-white/30 flex justify-center p-1">
              <div className="w-1 h-2 bg-[#b89b6a] rounded-full animate-bounce" />
            </div>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#f4f0e8]/50">Scroll to reveal</span>
          </div>
        )}
      </div>
    </div>
  );
}
