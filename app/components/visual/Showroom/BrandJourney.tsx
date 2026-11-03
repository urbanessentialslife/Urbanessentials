import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Shape = 'arch' | 'circle' | 'soft' | 'free';

interface ChapterImage {
  src: string;
  alt: string;
}

interface Chapter {
  id: string;
  label: string;
  /** Small lead-in, big solid word, outlined closing word(s). */
  lead: string;
  title: string;
  outline: string;
  body: string;
  stats?: { value: string; label: string }[];
  cta: { label: string; to: string };
  blob: string;
  /** Soft light behind the copy/photos, tinted to the chapter. */
  glow: string;
  /** big (tall, left), top (right), bottom (right) */
  images: [ChapterImage, ChapterImage, ChapterImage];
  /** 'free' = transparent cutouts floating straight on the blob. */
  shape: Shape;
  floatingPills?: [string, string];
}

// Facts here (24h dispatch, 3–6 day delivery, free shipping across India,
// complimentary gift note, name customization) mirror the shipping policy
// and product pages — keep them in sync if those change.
const CHAPTERS: Chapter[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    lead: 'Meet the',
    title: 'everyday,',
    outline: 'elevated.',
    body: 'Tumblers, glassware, travel pieces and little ones’ favourites — thoughtfully made to be used every day and gifted often.',
    stats: [
      { value: '24 hrs', label: 'Dispatch' },
      { value: '3–6 days', label: 'Delivery in India' },
      { value: 'Free', label: 'Shipping' },
    ],
    cta: { label: 'Shop everything', to: '/collections/all' },
    blob: 'linear-gradient(135deg,#d9b46a,#b88a3e)',
    glow: '217,180,106',
    shape: 'free',
    floatingPills: ['Double-Wall Vacuum', '12h Hot · 24h Cold'],
    images: [
      { src: '/images/products/hero/coffee-cup-stone-cream-cutout.webp', alt: 'The Coffee Cup in Stone Cream' },
      { src: '/images/products/hero/coffee-cup-sage-coral-cutout.webp', alt: 'The Coffee Cup in Sage Coral' },
      { src: '/images/products/hero/coffee-cup-midnight-forest-cutout.webp', alt: 'The Coffee Cup in Midnight Forest' },
    ],
  },
  {
    id: 'carry',
    label: 'Carry',
    lead: 'Made to',
    title: 'carry',
    outline: 'everywhere.',
    body: 'Insulated tumblers, flasks and thermoses that keep every sip hot or cold — and look good doing it, from the first commute to the last flight.',
    stats: [
      { value: '24 hrs', label: 'Cold retention' },
      { value: '12 hrs', label: 'Hot retention' },
      { value: '100%', label: 'Leak-proof seal' },
    ],
    cta: { label: 'Shop tumblers', to: '/collections/tumblers' },
    blob: 'linear-gradient(135deg,#8fae88,#5f7f5c)',
    glow: '143,174,136',
    shape: 'free',
    floatingPills: ['18/8 Pro-Grade Steel', 'Thermal Lock Cap'],
    images: [
      { src: '/images/products/hero/everyday-tumbler-black-cutout.webp', alt: 'The Everyday Tumbler in black' },
      { src: '/images/products/hero/flask-butterfly-cutout.webp', alt: 'Heritage Enamel Vacuum Flask' },
      { src: '/images/products/hero/thermos-honey-cutout.webp', alt: 'Petite Milk Thermos in honey' },
    ],
  },
  {
    id: 'serve',
    label: 'Serve',
    lead: 'For the table,',
    title: 'sip',
    outline: '& serve.',
    body: 'Ribbed glass, bamboo lids and statement jugs — pieces that make an everyday table feel like an occasion.',
    stats: [
      { value: 'Borosilicate', label: 'Thermal glass' },
      { value: 'Organic', label: 'Natural bamboo' },
      { value: 'Dishwasher', label: 'Safe care' },
    ],
    cta: { label: 'Explore glassware', to: '/collections/all' },
    blob: 'linear-gradient(135deg,#d99a8a,#b5603f)',
    glow: '217,154,138',
    shape: 'free',
    floatingPills: ['Hand-Blown Ribbed Glass', 'Natural Bamboo Seal'],
    images: [
      { src: '/images/products/hero/bamboo-lid-cup-cutout.webp', alt: 'Ribbed Glass Cup with Bamboo Lid' },
      { src: '/images/products/hero/amber-jug-set-cutout.webp', alt: 'Amber Ribbed Glass Water Jug Set' },
      { src: '/images/products/hero/beverage-dispenser-cutout.webp', alt: 'Ribbed Glass Beverage Dispenser' },
    ],
  },
  {
    id: 'little-ones',
    label: 'Little ones',
    lead: 'Small hands,',
    title: 'big',
    outline: 'joy.',
    body: 'Character bottles kids actually ask for. Spin the panda in 3D, or place it on your table in AR, before you choose.',
    stats: [
      { value: 'Food-grade', label: 'BPA-free steel' },
      { value: 'One-touch', label: 'Flip straw lid' },
      { value: '3D & AR', label: 'View in room' },
    ],
    cta: { label: 'Meet the Panda', to: '/products/cute-character-water-bottle-collection' },
    blob: 'linear-gradient(135deg,#a79be0,#6e60b8)',
    glow: '167,155,224',
    shape: 'free',
    floatingPills: ['100% BPA-Free Safe', 'Interactive 3D / AR'],
    images: [
      { src: '/images/products/hero/character-bottle-panda-cutout.webp', alt: 'Panda Character Water Bottle' },
      { src: '/images/products/hero/character-bottle-elephant-cutout.webp', alt: 'Elephant Character Water Bottle' },
      { src: '/images/products/hero/character-bottle-bunny-cutout.webp', alt: 'Bunny Character Water Bottle' },
    ],
  },
  {
    id: 'yours',
    label: 'Yours',
    lead: 'Make it',
    title: 'truly',
    outline: 'yours.',
    body: 'Add a name to select pieces for a gift that is unmistakably theirs. Every order comes with a complimentary gift note.',
    stats: [
      { value: 'Laser', label: 'Monogramming' },
      { value: 'Free', label: 'Custom gift note' },
      { value: 'Bespoke', label: 'Luxury packaging' },
    ],
    cta: { label: 'Start gifting', to: '/collections/all' },
    blob: 'linear-gradient(135deg,#e6c98a,#c79a45)',
    glow: '230,201,138',
    shape: 'free',
    floatingPills: ['Custom Laser Engraved', 'Free Gift Note'],
    images: [
      { src: '/images/products/hero/everyday-tumbler-pink-cutout.webp', alt: 'The Everyday Tumbler in pink' },
      { src: '/images/products/hero/everyday-tumbler-blue-cutout.webp', alt: 'The Everyday Tumbler in blue' },
      { src: '/images/products/hero/everyday-tumbler-lightgreen-cutout.webp', alt: 'The Everyday Tumbler in light green' },
    ],
  },
];

const SHAPE_CLASS: Record<Exclude<Shape, 'free'>, [string, string, string]> = {
  arch: ['rounded-t-[999px] rounded-b-[2rem]', 'rounded-full', 'rounded-[2rem]'],
  circle: ['rounded-full', 'rounded-full', 'rounded-full'],
  soft: ['rounded-[2rem]', 'rounded-[2rem]', 'rounded-[2rem]'],
};

/**
 * The story that picks up right after the showroom + cinematic scroll.
 *
 * On large screens it pins to the viewport and pans sideways as you scroll
 * (vertical scroll -> horizontal travel), one "chapter" per screen, with
 * the product photos drifting slightly against the pan. Everywhere else —
 * phones, tablets, and visitors who prefer reduced motion — the exact same
 * chapters simply stack vertically, with no pinning at all.
 */
export function BrandJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [horizontal, setHorizontal] = useState(false);
  const [active, setActive] = useState(0);

  // Horizontal pin only where there's room for it and motion is welcome.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setHorizontal(wide.matches && !reduce.matches);
    update();
    wide.addEventListener('change', update);
    reduce.addEventListener('change', update);
    return () => {
      wide.removeEventListener('change', update);
      reduce.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!horizontal || !sectionRef.current || !trackRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const track = trackRef.current;
    const section = sectionRef.current;
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const ctx = gsap.context(() => {
      let last = 0;
      const pan = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        modifiers: { x: (value: string) => `${Math.round(parseFloat(value))}px` },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance() * 1.15}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(CHAPTERS.length - 1, Math.round(self.progress * (CHAPTERS.length - 1)));
            if (idx !== last) {
              last = idx;
              setActive(idx);
            }
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', track);
      panels.forEach((panel, i) => {
        if (i > 0) {
          gsap.fromTo(
            panel.querySelectorAll('[data-reveal]'),
            { opacity: 0, y: 36 },
            {
              opacity: 1,
              y: 0,
              ease: 'none',
              stagger: 0.06,
              scrollTrigger: {
                trigger: panel,
                containerAnimation: pan,
                start: 'left 92%',
                end: 'left 42%',
                scrub: true,
              },
            },
          );
        }
        panel.querySelectorAll<HTMLElement>('[data-drift]').forEach((el) => {
          const amount = Number(el.dataset.drift ?? 0);
          gsap.fromTo(
            el,
            { y: -amount },
            {
              y: amount,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                containerAnimation: pan,
                start: 'left right',
                end: 'right left',
                scrub: true,
              },
            },
          );
        });
      });
    }, section);

    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [horizontal]);

  return (
    <section
      ref={sectionRef}
      id="journey"
      aria-label="Our story"
      className={`relative w-full overflow-x-clip bg-[#0a0b0d] text-[#f4f0e8] font-sans antialiased ${horizontal ? 'h-screen overflow-hidden' : ''}`}
    >
      <div
        ref={trackRef}
        className={horizontal ? 'flex h-full w-max will-change-transform [backface-visibility:hidden]' : 'flex flex-col'}
      >
        {CHAPTERS.map((chapter, index) => (
          <article
            key={chapter.id}
            data-panel
            style={{
              backgroundImage: `radial-gradient(55% 65% at 70% 50%, rgba(${chapter.glow},0.12), transparent 70%), radial-gradient(40% 45% at 15% 90%, rgba(${chapter.glow},0.05), transparent 70%)`,
            }}
            className={`relative flex items-center justify-between ${
              horizontal
                ? 'w-screen h-full shrink-0 px-[7vw] pt-20 pb-28 gap-[5vw]'
                : 'w-full flex-col lg:flex-row px-5 sm:px-8 md:px-12 py-16 lg:py-24 gap-12 lg:gap-[5vw] lg:min-h-screen lg:pt-28'
            }`}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-24 left-0 w-px bg-gradient-to-b from-transparent via-[#dfc08a]/25 to-transparent" />

            {/* ── Copy Left Column ── */}
            <div className="relative z-10 w-full lg:w-[min(36vw,520px)] shrink-0">
              <span
                data-reveal
                className="inline-flex items-center gap-2.5 rounded-full border border-[#dfc08a]/40 bg-[#dfc08a]/10 backdrop-blur-md px-3.5 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#e8c992] font-medium shadow-[0_2px_15px_rgba(223,192,138,0.15)]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dfc08a] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#dfc08a]"></span>
                </span>
                <span className="font-serif font-bold text-xs text-[#dfc08a] tracking-normal">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {chapter.label}
              </span>

              <h2 data-reveal className="mt-6 font-serif leading-[0.98]">
                <span className="block text-lg sm:text-xl font-normal italic tracking-[0.05em] text-[#dfc08a]/90 font-serif">
                  {chapter.lead}
                </span>
                <span className="block mt-1 text-[clamp(2.75rem,5.5vw,5.8rem)] font-light tracking-[-0.02em] text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f7f2e8] to-[#ded5c5]">
                  {chapter.title}
                </span>
                <span className="block text-[clamp(2.4rem,4.8vw,5.2rem)] font-normal italic tracking-[-0.01em] text-transparent bg-clip-text bg-gradient-to-r from-[#e5c38c] via-[#f5e4c3] to-[#c79a45] drop-shadow-sm">
                  {chapter.outline}
                </span>
              </h2>

              <div aria-hidden="true" className="mt-6 flex items-center gap-3">
                <span className="block h-px w-16 bg-gradient-to-r from-[#dfc08a] to-[#dfc08a]/30" />
                <span className="h-1.5 w-1.5 rotate-45 border border-[#dfc08a]/60 bg-[#dfc08a]/30" />
                <span className="block h-px w-6 bg-gradient-to-r from-[#dfc08a]/30 to-transparent" />
              </div>

              <p data-reveal className="mt-6 max-w-md text-base sm:text-[16.5px] leading-[1.75] text-[#f4f0e8]/80 font-sans font-normal">
                {chapter.body}
              </p>

              {chapter.stats && (
                <div data-reveal className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg">
                  {chapter.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-[#dfc08a]/40 hover:bg-white/[0.06] p-3 sm:p-4 backdrop-blur-md transition-all duration-300 shadow-sm"
                    >
                      <dt className="sr-only">{stat.label}</dt>
                      <dd className="font-serif text-xl sm:text-2xl lg:text-[26px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#faf6ee] to-[#dfc08a] leading-none whitespace-nowrap">
                        {stat.value}
                      </dd>
                      <p aria-hidden="true" className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[#f4f0e8]/70 font-sans leading-tight">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Link
                data-reveal
                to={chapter.cta.to}
                prefetch="intent"
                className="group relative mt-8 inline-flex items-center gap-3.5 rounded-full bg-gradient-to-r from-[#dfc08a] via-[#f0deba] to-[#cda558] hover:from-[#e5caa0] hover:to-[#dfc08a] text-[#1c1512] pl-7 pr-2.5 py-3 text-xs uppercase tracking-[0.22em] font-semibold transition-all duration-300 shadow-[0_10px_30px_-5px_rgba(223,192,138,0.35)] hover:shadow-[0_15px_35px_-5px_rgba(223,192,138,0.55)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{chapter.cta.label}</span>
                <span className="w-8 h-8 rounded-full bg-[#1c1512] text-[#dfc08a] flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[#2a201b]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14m-6-6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </div>

            {/* ── Imagery: Luxury Architectural Stage + Floating Products ── */}
            <div className="relative z-10 w-full max-w-[580px] lg:max-w-none lg:w-[min(48vw,660px)] shrink-0 h-[400px] sm:h-[480px] lg:h-[min(68vh,620px)] mx-auto">
              {/* Luxury Studio Stage Backdrop (Replaces plain solid yellow blob) */}
              <div aria-hidden="true" className="absolute inset-0 -z-0 pointer-events-none flex items-center justify-center">
                {/* Ambient radial glow */}
                <div
                  className="absolute w-[110%] h-[110%] rounded-full blur-[70px] sm:blur-[95px] animate-luxury-pulse"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, rgba(${chapter.glow}, 0.28) 0%, rgba(${chapter.glow}, 0.08) 50%, transparent 75%)`,
                  }}
                />

                {/* Frosted Glass Stage Plinth */}
                <div className="relative w-full h-full rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/[0.12] bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.2)] overflow-hidden">
                  {/* Internal ambient corner glow */}
                  <div
                    className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-35 pointer-events-none"
                    style={{ background: `rgb(${chapter.glow})` }}
                  />

                  {/* Concentric subtle gold architectural orbit frames */}
                  <div className="absolute inset-3.5 sm:inset-5 rounded-[2rem] sm:rounded-[2.8rem] border border-[#dfc08a]/15 pointer-events-none" />
                  <div className="absolute inset-7 sm:inset-10 rounded-[1.6rem] sm:rounded-[2.2rem] border border-dashed border-[#dfc08a]/10 pointer-events-none" />

                  {/* Luxury brass alignment corner marks */}
                  <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t border-l border-[#dfc08a]/60" />
                  <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t border-r border-[#dfc08a]/60" />
                  <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b border-l border-[#dfc08a]/60" />
                  <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b border-r border-[#dfc08a]/60" />
                </div>
              </div>

              {/* 2-column image layout (hero product on left, two curated finishes on right) */}
              <div className="relative z-10 grid h-full grid-cols-[1.3fr_1fr] grid-rows-2 gap-3 sm:gap-5 p-4 sm:p-6">
                <ChapterPhoto
                  image={chapter.images[0]}
                  shape={chapter.shape}
                  slot={0}
                  floatingPill={chapter.floatingPills?.[0]}
                  className="row-span-2"
                />
                <div className="flex items-center justify-end" data-drift={horizontal ? 22 : 0}>
                  <ChapterPhoto
                    image={chapter.images[1]}
                    shape={chapter.shape}
                    slot={1}
                  />
                </div>
                <div className="flex items-center justify-start" data-drift={horizontal ? -22 : 0}>
                  <ChapterPhoto
                    image={chapter.images[2]}
                    shape={chapter.shape}
                    slot={2}
                    floatingPill={chapter.floatingPills?.[1]}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ── Chapter progress (horizontal mode only) ── */}
      {horizontal && (
        <div className="absolute bottom-14 inset-x-[7vw] z-20 flex items-center gap-5 pointer-events-none">
          <span className="font-serif text-sm text-[#dfc08a] tabular-nums whitespace-nowrap">
            {String(active + 1).padStart(2, '0')}
            <span className="text-[#f4f0e8]/40"> / {String(CHAPTERS.length).padStart(2, '0')}</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#f4f0e8]/60 w-28 whitespace-nowrap">
            {CHAPTERS[active].label}
          </span>
          <div className="relative h-px flex-1 bg-[#f4f0e8]/15">
            <div ref={barRef} className="absolute inset-0 origin-left bg-[#dfc08a]" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
      )}
    </section>
  );
}

function ChapterPhoto({
  image,
  shape,
  slot,
  floatingPill,
  className = '',
}: {
  image: ChapterImage;
  shape: Shape;
  slot: 0 | 1 | 2;
  floatingPill?: string;
  className?: string;
}) {
  if (shape === 'free') {
    // Transparent cutouts — floating on the luxury glass plinth with smooth 3D levitation & soft pedestal shadow
    const animationClass =
      slot === 0
        ? 'animate-luxury-float'
        : slot === 1
          ? 'animate-luxury-float-delayed'
          : 'animate-luxury-float';

    return (
      <div className={`relative flex items-center justify-center min-h-0 ${slot === 0 ? 'h-full' : 'h-[92%] aspect-square'} ${className}`}>
        {/* Floating Feature Pill on hero cup */}
        {slot === 0 && floatingPill && (
          <div className="absolute -top-1 sm:top-2 left-0 sm:-left-3 z-20 pointer-events-none hidden xs:inline-flex items-center gap-1.5 rounded-full border border-[#dfc08a]/40 bg-black/60 px-3 py-1.5 backdrop-blur-md shadow-xl text-[9.5px] sm:text-[10.5px] font-medium tracking-wider uppercase text-[#f4f0e8]">
            <span className="text-[#dfc08a] text-xs">✦</span>
            <span>{floatingPill}</span>
          </div>
        )}

        {/* Secondary Pill on slot 2 */}
        {slot === 2 && floatingPill && (
          <div className="absolute -bottom-2 right-0 z-20 pointer-events-none hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 backdrop-blur-md shadow-lg text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-[#dfc08a]">
            <span>{floatingPill}</span>
          </div>
        )}

        {/* Realistic ground contact shadow under hero product */}
        {slot === 0 && (
          <div
            aria-hidden="true"
            className="absolute bottom-2 inset-x-8 h-6 rounded-full bg-black/70 blur-md pointer-events-none"
          />
        )}

        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className={`max-h-full max-w-full object-contain ${animationClass} ${
            slot === 0
              ? 'drop-shadow-[0_28px_36px_rgba(0,0,0,0.65)] hover:scale-105 transition-transform duration-500 cursor-pointer'
              : 'drop-shadow-[0_20px_24px_rgba(0,0,0,0.5)] hover:scale-110 transition-transform duration-500 cursor-pointer'
          }`}
        />
      </div>
    );
  }

  const shapeClass = SHAPE_CLASS[shape][slot];
  const framing =
    slot === 0
      ? 'w-full h-full'
      : 'h-[90%] aspect-square max-w-full';
  return (
    <div className={`relative min-h-0 min-w-0 ${slot === 0 ? '' : 'flex items-center justify-center'} ${className}`}>
      {floatingPill && slot === 0 && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none hidden xs:inline-flex items-center gap-1.5 rounded-full border border-[#dfc08a]/40 bg-black/60 px-3 py-1.5 backdrop-blur-md shadow-xl text-[9.5px] sm:text-[10.5px] font-medium tracking-wider uppercase text-[#f4f0e8]">
          <span className="text-[#dfc08a] text-xs">✦</span>
          <span>{floatingPill}</span>
        </div>
      )}
      <div
        className={`group ${framing} ${shapeClass} overflow-hidden bg-[#16181c] ring-1 ring-white/15 hover:ring-[#dfc08a]/50 transition-all duration-500 shadow-[0_30px_60px_rgba(0,0,0,0.55)]`}
      >
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
    </div>
  );
}
