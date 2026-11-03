import { formatAmount } from '~/lib/money';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollFrameSequence } from '~/components/visual/Common/ScrollFrameSequence';
import { SwatchButton } from '~/components/visual/Product/SwatchButton';
import { DisplayHeadline } from '~/components/visual/Common/DisplayHeadline';
import type { ShowcaseProduct } from '~/data/showcaseProducts';

const FRAME_COUNT = 237;
// Pre-baked frame sequences only exist for The Coffee Cup's three finishes —
// one folder per variant, in the same order as its variants array.
const FRAME_FOLDERS = ['coffee-cup-01', 'coffee-cup-02', 'coffee-cup-03'];

interface ProductCinematicScrollProps {
  /** The Coffee Cup, fetched by handle in the homepage loader. */
  product: ShowcaseProduct | null;
}

/**
 * The scroll-scrubbed finale right after the BrandJourney story — the
 * site's signature piece rendered as a real frame-sequence "walk-around"
 * (same canvas-scrub technique as ShowroomGate, see ScrollFrameSequence for
 * why: a <video> can't be scrubbed smoothly on scroll) rather than another
 * static product grid, so the energy of the entrance doesn't immediately go
 * flat. Finish switching is a tap, not tied to scroll position, so a
 * visitor can compare finishes without losing their place in the scrub.
 *
 * Hardcoded to the one product these frames were shot for — if a future
 * hero product doesn't have matching frames, this quietly renders nothing
 * rather than showing a half-built cinematic for a product with no footage.
 */
export function ProductCinematicScroll({ product }: ProductCinematicScrollProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeFinish, setActiveFinish] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !triggerRef.current || !pinRef.current || !product) return;

    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setProgress(1);
      return;
    }

    const ctx = gsap.context(() => {
      const pinEl = pinRef.current!;
      const hud = pinEl.querySelector('.cinematic-hud');
      gsap.set(hud, { opacity: 0, y: 20 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: pinEl,
          pinSpacing: true,
          scrub: 0.5,
          onUpdate: (self) => setProgress(self.progress),
        },
      });

      tl.to(hud, { opacity: 1, y: 0, duration: 0.2, ease: 'power1.out' }, 0.55);
    }, triggerRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) return null;

  const activeVariant = product.variants[activeFinish] ?? product.variants[0];

  return (
    <div ref={triggerRef} id="featured" className="relative w-full h-[260vh]">
      <div ref={pinRef} className="relative w-full h-screen overflow-hidden bg-[#07080a]">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(223,192,138,0.1) 0%, rgba(7,8,10,0.4) 65%, #07080a 100%)',
          }}
        />

        <ScrollFrameSequence
          basePath={`/frames/${FRAME_FOLDERS[activeFinish]}`}
          frameCount={FRAME_COUNT}
          progress={progress}
          className="absolute inset-0 w-full h-full"
        />

        {/* Finish switcher — a vertical dock on the right edge (a horizontal
            pill above the headline on phones), centred on
            the screen, so it can never sit on top of the product (which is
            centred) or under the fixed site header. Independent of scroll. */}
        <div className="absolute z-20 flex items-center gap-1 rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/10 px-3 py-1 left-1/2 -translate-x-1/2 bottom-[13.5rem] sm:bottom-60 lg:left-auto lg:translate-x-0 lg:right-8 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:gap-2 lg:px-1 lg:py-3">
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#dfc08a] font-medium pr-1 lg:pr-0 lg:pb-1 lg:[writing-mode:vertical-rl] lg:rotate-180">
            Finish
          </span>
          {product.variants.map((v, i) => (
            <SwatchButton
              key={v.id}
              color={v.colorHex}
              selected={activeFinish === i}
              title={`View ${v.name} finish`}
              onClick={() => setActiveFinish(i)}
              size={22}
              activeRingClass="ring-2 ring-[#dfc08a]"
            />
          ))}
        </div>

        {/* Cinematic HUD — product identity + CTA, fading in as the scrub
            nears its end so the reveal feels earned, not immediate. On large
            screens it sits in the empty left third instead of the bottom
            centre, where it landed on the product's base. */}
        <div className="cinematic-hud absolute inset-x-0 bottom-10 sm:bottom-14 flex flex-col items-center text-center px-6 z-20 opacity-0 lg:inset-x-auto lg:left-[6vw] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:items-start lg:text-left lg:max-w-[28vw] lg:px-0">
          <DisplayHeadline
            lines={[
              { text: 'Crafted for', weight: 'light' },
              { text: product.title, weight: 'bold' },
            ]}
          />
          <p className="text-xs sm:text-sm text-[#dfc08a] uppercase tracking-[0.2em] mt-3">
            {activeVariant.name} · {product.currencySymbol}
            {formatAmount(product.price, product.currencySymbol)}
          </p>
          <Link
            to={`/products/${product.handle}`}
            prefetch="intent"
            className="mt-5 px-7 py-3 rounded-full bg-[#dfc08a] hover:bg-[#ecd9ab] text-[#241a16] text-xs uppercase tracking-widest font-semibold transition-colors"
          >
            Shop This Piece
          </Link>
        </div>
      </div>
    </div>
  );
}
