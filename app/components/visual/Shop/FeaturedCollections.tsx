import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface FeaturedCollectionItem {
  id: string;
  handle: string;
  tagline: string;
  title: string;
  badge: string;
  description: string;
  image: string;
  imagePosition?: string;
  itemCountLabel: string;
  to: string;
  featured?: boolean;
}

const CURATED_COLLECTIONS: FeaturedCollectionItem[] = [
  {
    id: 'tumblers',
    handle: 'stanley-travel-mug',
    tagline: 'Flagship Series',
    title: 'Daily Tumblers & Travel Mugs',
    badge: '24H Chill Lock',
    description: 'Triple-wall vacuum insulated daily carry tumblers with ergonomic handles & splash-resistant lids.',
    image: '/frames/coffee-cup-01/frame-0001.webp',
    imagePosition: 'center center',
    itemCountLabel: 'Curated Tumblers & Cups',
    to: '/collections/stanley-travel-mug',
    featured: true,
  },
  {
    id: 'crockery',
    handle: 'crockery',
    tagline: 'Handcrafted',
    title: 'Artisanal Glassware & Crockery',
    badge: 'Borosilicate Glass',
    description: 'Fluted amber carafes, ribbed tea glasses, cups with saucers & crystal candy jars.',
    image: '/images/products/new/amber-jug-set.jpg',
    imagePosition: 'center center',
    itemCountLabel: 'Carafes, Mugs & Crystal',
    to: '/collections/crockery',
  },
  {
    id: 'kids',
    handle: 'kids-motif-water-bottle',
    tagline: 'Little Ones',
    title: 'Kids Motif Water Bottle',
    badge: '100% BPA Free',
    description: 'Silicone-guarded character bottles and spill-proof flip straws built for little adventurers.',
    image: '/images/products/new/character-bottle-panda.jpg',
    imagePosition: 'center 10%',
    itemCountLabel: 'Kids Bottles & Motifs',
    to: '/collections/kids-motif-water-bottle',
  },
  {
    id: 'bottles',
    handle: 'urban-essentials-water-bottle',
    tagline: 'Everyday Carry',
    title: 'Urban Essentials Water Bottle',
    badge: 'Premium Hydration',
    description: 'Ergonomic carry-handle ribbed and button-press insulated thermal bottles.',
    image: '/images/products/new/beverage-dispenser.jpg',
    imagePosition: 'center center',
    itemCountLabel: 'Hydration & Flasks',
    to: '/collections/urban-essentials-water-bottle',
  },
  {
    id: 'flasks',
    handle: 'insulated-bottles',
    tagline: 'Commuter Edition',
    title: 'Travelling Insulated Bottles',
    badge: 'Thermal Lock',
    description: 'Double-wall stainless steel thermoses with ergonomic carry loops & 24h heat endurance.',
    image: '/images/products/new/mini-thermos-yellow.jpg',
    imagePosition: 'center 38%',
    itemCountLabel: 'Thermos & Flasks',
    to: '/collections/insulated-bottles',
  },
];

interface FeaturedCollectionsProps {
  categories?: { handle: string; title: string; image?: { url: string } | null }[];
}

export function FeaturedCollections({ categories = [] }: FeaturedCollectionsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Match live Shopify collection handles if available
  const items = CURATED_COLLECTIONS.map((item) => {
    const liveMatch = categories.find(
      (c) =>
        c.handle.toLowerCase() === item.handle.toLowerCase() ||
        c.handle.toLowerCase().includes(item.id) ||
        item.id.includes(c.handle.toLowerCase()) ||
        c.title.toLowerCase().includes(item.id),
    );

    const targetHandle = liveMatch?.handle || item.handle;
    return {
      ...item,
      handle: targetHandle,
      to: `/collections/${targetHandle}`,
      title: liveMatch?.title || item.title,
      // If Shopify collection has a high-res custom image uploaded, fallback to curated local high-res asset
      image: liveMatch?.image?.url || item.image,
    };
  });

  const heroItem = items[0];
  const secondaryItems = items.slice(1);

  useEffect(() => {
    if (typeof window === 'undefined' || !gridRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const cards = gridRef.current.querySelectorAll('.collection-card');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            once: true,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12 font-sans text-[#241a16]"
    >
      <div className="max-w-7xl mx-auto">
        {/* ── Section Header ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 sm:mb-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b89b6a]/30 bg-[#b89b6a]/10 px-3.5 py-1 text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#8c6b36] font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b89b6a] animate-pulse" />
              Curated Archives • 2026
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[46px] font-normal tracking-[-0.01em] text-[#241a16] leading-[1.15]">
              Explore by <span className="italic text-[#b89b6a]">Collection</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#241a16]/70 max-w-xl font-normal leading-relaxed">
              Everyday architectural drinkware, hand-blown glassware, and playful companions crafted with thoughtful details.
            </p>
          </div>

          {/* Quick link button */}
          <Link
            to="/collections/all"
            prefetch="intent"
            className="group inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] font-semibold text-[#241a16] hover:text-[#b89b6a] transition-colors self-start md:self-end pb-1"
          >
            <span>View All Collections</span>
            <span className="w-8 h-8 rounded-full border border-[#241a16]/20 group-hover:border-[#b89b6a] group-hover:bg-[#b89b6a] group-hover:text-white flex items-center justify-center transition-all duration-300">
              <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </Link>
        </div>

        {/* ── Collection Pills Shortcut Rail ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-4 mb-6 sm:mb-8 text-xs">
          <Link
            to="/collections/all"
            className="shrink-0 px-4 py-2 rounded-full border border-[#241a16]/15 bg-neutral-100 hover:bg-[#241a16] hover:text-white hover:border-[#241a16] text-[#241a16] font-medium transition-all duration-300 tracking-wide"
          >
            All Pieces
          </Link>
          {items.map((it) => (
            <Link
              key={it.id}
              to={it.to}
              prefetch="intent"
              className="shrink-0 px-4 py-2 rounded-full border border-[#e2ddd5] bg-neutral-50/80 hover:bg-white hover:border-[#b89b6a] hover:text-[#8c6b36] text-[#241a16]/80 font-medium transition-all duration-300 tracking-wide shadow-xs"
            >
              {it.title}
            </Link>
          ))}
        </div>

        {/* ── Editorial Bento Showcase Grid ── */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6"
        >
          {/* ── Featured Hero Tile (Left 5 Cols on Desktop) ── */}
          {heroItem && (
            <div className="collection-card lg:col-span-5 relative group overflow-hidden rounded-3xl border border-[#c9c2b8]/60 bg-[#161210] text-white shadow-[0_10px_30px_rgba(36,26,22,0.06)] hover:shadow-[0_24px_50px_rgba(36,26,22,0.18)] hover:border-[#b89b6a]/70 transition-all duration-500 min-h-[460px] sm:min-h-[520px] lg:min-h-[600px] flex flex-col justify-between">
              <Link to={heroItem.to} prefetch="intent" className="absolute inset-0 z-20">
                <span className="sr-only">Explore {heroItem.title}</span>
              </Link>

              {/* Background Image with Zoom & Correct Framing */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={heroItem.image}
                  alt={heroItem.title}
                  style={{ objectPosition: heroItem.imagePosition || 'center center' }}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                {/* Multi-layer Cinematic Scrim for Pristine Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#140f0c] via-[#140f0c]/60 via-42% to-transparent opacity-95 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-[#140f0c]/85" />
                {/* Ambient Warm Glow */}
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#b89b6a]/20 blur-3xl pointer-events-none group-hover:bg-[#b89b6a]/30 transition-all duration-700" />
              </div>

              {/* Top Meta Bar */}
              <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/25 text-[10px] uppercase tracking-[0.2em] font-semibold text-white drop-shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dfc08a]" />
                  {heroItem.tagline}
                </span>
                <span className="text-[11px] font-mono tracking-wider text-white/80 uppercase drop-shadow-xs">
                  {heroItem.badge}
                </span>
              </div>

              {/* Bottom Content & CTA */}
              <div className="relative z-10 p-6 sm:p-8 pt-0">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#dfc08a] font-semibold block mb-2 drop-shadow-xs">
                  {heroItem.itemCountLabel}
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal leading-tight text-white mb-3 drop-shadow-sm">
                  {heroItem.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2 max-w-md font-light leading-relaxed mb-6 drop-shadow-xs">
                  {heroItem.description}
                </p>

                {/* Pill Button */}
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#b89b6a] text-[#241a16] font-semibold text-xs tracking-wider uppercase group-hover:bg-white group-hover:text-[#241a16] transition-all duration-300 shadow-md">
                  <span>Shop Series</span>
                  <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* ── Secondary 4 Tiles (Right 7 Cols on Desktop) ── */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {secondaryItems.map((item, idx) => (
              <div
                key={item.id}
                className="collection-card relative group overflow-hidden rounded-3xl border border-[#c9c2b8]/60 bg-[#161210] shadow-[0_6px_24px_rgba(36,26,22,0.04)] hover:shadow-[0_20px_45px_rgba(36,26,22,0.14)] hover:border-[#b89b6a]/70 transition-all duration-500 min-h-[260px] sm:min-h-[285px] flex flex-col justify-between"
              >
                <Link to={item.to} prefetch="intent" className="absolute inset-0 z-20">
                  <span className="sr-only">Explore {item.title}</span>
                </Link>

                {/* Background Image with Zoom & Custom Focal Position */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ objectPosition: item.imagePosition || 'center center' }}
                    className="w-full h-full object-cover transform group-hover:scale-106 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  {/* High-contrast Gradient Scrim so all labels pop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#140f0c] via-[#140f0c]/80 via-48% to-black/25 group-hover:via-[#140f0c]/70 transition-colors duration-500" />
                </div>

                {/* Top Badge */}
                <div className="relative z-10 p-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/25 text-[9px] uppercase tracking-[0.2em] font-semibold text-white drop-shadow-xs">
                    {item.tagline}
                  </span>
                  <span className="text-[10px] font-mono tracking-wider text-white/80 drop-shadow-xs">
                    0{idx + 2}
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 p-5 sm:p-6 pt-0">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#dfc08a] font-semibold block mb-1 drop-shadow-xs">
                    {item.badge}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-white group-hover:text-[#f4f0e8] leading-tight transition-colors drop-shadow-sm">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/90 line-clamp-2 font-light leading-relaxed drop-shadow-xs">
                    {item.description}
                  </p>

                  {/* Micro Arrow Cue */}
                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-semibold text-white/90 group-hover:text-[#dfc08a] transition-colors">
                    <span>Explore Collection</span>
                    <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Brand Trust / Editorial Guarantee Ribbon ── */}
        <div className="mt-10 sm:mt-14 py-6 px-6 sm:px-10 rounded-2xl border border-[#e5e0d8] bg-neutral-50/70 backdrop-blur-xs grid grid-cols-2 lg:grid-cols-4 gap-6 text-center lg:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#b89b6a]/15 text-[#8c6b36] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-[#241a16]">Original Design</div>
              <div className="text-[11px] text-[#241a16]/60">Food-grade steel & borosilicate</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#b89b6a]/15 text-[#8c6b36] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-[#241a16]">Fast Dispatch</div>
              <div className="text-[11px] text-[#241a16]/60">Ships within 24 business hours</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#b89b6a]/15 text-[#8c6b36] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-[#241a16]">Luxury Gifting</div>
              <div className="text-[11px] text-[#241a16]/60">Signature box packaging</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#b89b6a]/15 text-[#8c6b36] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-[#241a16]">Verified Safe Checkout</div>
              <div className="text-[11px] text-[#241a16]/60">UPI, Cards & Netbanking via Fastrr</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
