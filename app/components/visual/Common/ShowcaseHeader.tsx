import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Await, Link, useLocation } from 'react-router';
import { useShowcaseCart } from '~/context/ShowcaseCartContext';
import { useWishlist } from '~/context/WishlistContext';
import { LogoMark } from './Logo';
import { DEFAULT_NAV_MENUS, type NavMenu } from '~/lib/navMenus';

interface ShowcaseHeaderProps {
  isLoggedIn?: Promise<boolean>;
  categories?: { handle: string; title: string }[];
  /** Collection handle -> Shopify collection image, for the mega-menu tiles. */
  collectionImages?: Record<string, string>;
  /** Category tree from Shopify's main-menu; falls back to DEFAULT_NAV_MENUS when empty. */
  menus?: NavMenu[];
  onOpenSearch: () => void;
}


/**
 * Hover dropdown. The panel is portalled to <body> and positioned from the
 * trigger's bounding box, because the nav strip scrolls horizontally —
 * `overflow-x: auto` clips any absolutely-positioned child, so an inline
 * panel would be cut off.
 */
function NavDropdown({ menu, collectionImages }: { menu: NavMenu; collectionImages?: Record<string, string> }) {
  const [pos, setPos] = useState<{ top: number; bridge: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = pos !== null;

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = triggerRef.current?.getBoundingClientRect();
    const headerBottom = triggerRef.current?.closest('header')?.getBoundingClientRect().bottom;
    // The panel hangs off the header's bottom edge; `bridge` is the empty
    // strip between the trigger and that edge, kept hoverable.
    if (rect && headerBottom !== undefined) setPos({ top: rect.bottom, bridge: Math.max(0, headerBottom - rect.bottom) });
  }, []);
  // Debounced close so crossing the gap between trigger and panel doesn't flicker
  const hide = useCallback(() => {
    closeTimer.current = setTimeout(() => setPos(null), 120);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [open]);

  return (
    <div ref={triggerRef} className="relative shrink-0" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex items-center gap-1.5 whitespace-nowrap uppercase transition-colors duration-200 cursor-pointer py-1 hover:text-[#b89b6a] ${
          open ? 'text-[#b89b6a]' : ''
        }`}
      >
        {menu.label}
        <svg
          className={`w-2.5 h-2.5 mt-px transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            style={{ top: pos.top, paddingTop: pos.bridge }}
            className="fixed inset-x-0 z-50 font-sans"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className="bg-[#f4f0e8] border-b border-[#c9c2b8] shadow-[0_24px_48px_rgba(36,26,22,0.12)] animate-[navDropIn_160ms_ease-out]">
              <div className="max-w-[1480px] mx-auto px-8 pt-7 pb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <ul className="flex justify-center gap-x-6 xl:gap-x-8 w-max mx-auto normal-case tracking-normal">
                  {menu.items.map((sub) => {
                    // Shopify collection photo wins; the bundled image is the fallback.
                    const image = collectionImages?.[sub.to.split('/').pop() ?? ''] ?? sub.image;
                    return (
                    <li key={sub.label}>
                      <Link
                        to={sub.to}
                        prefetch="intent"
                        onClick={() => setPos(null)}
                        className="group flex flex-col items-center w-28 xl:w-36"
                      >
                        <span className="block w-full aspect-square rounded-full overflow-hidden bg-[#e8e1d4] ring-1 ring-[#c9c2b8]/70 group-hover:ring-2 group-hover:ring-[#b89b6a] transition-all duration-300 flex items-center justify-center">
                          {image ? (
                            <img
                              src={image}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <LogoMark className="w-1/3 h-1/3 text-[#241a16]/20" />
                          )}
                        </span>
                        <span className="mt-3 w-full pb-2 border-b border-[#c9c2b8]/80 group-hover:border-[#b89b6a] text-center text-[13px] font-semibold text-[#241a16] group-hover:text-[#b89b6a] transition-colors leading-snug">
                          {sub.label}
                        </span>
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/**
 * Horizontally scrollable nav strip: centred when everything fits, and
 * shows ‹ › arrows (only in a direction there's more to reveal) when the
 * categories outgrow the space between the logo and the action icons.
 */
function ScrollableNav({ className, children }: { className: string; children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, [update]);

  const scrollBy = (dir: -1 | 1) =>
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });

  const arrowCls =
    'absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#f4f0e8] text-[#241a16] border border-[#c9c2b8] shadow-sm flex items-center justify-center cursor-pointer hover:bg-white hover:text-[#b89b6a] transition-colors';

  return (
    <div className="hidden lg:block relative flex-1 min-w-0">
      {canLeft && (
        <button type="button" aria-label="Scroll categories left" onClick={() => scrollBy(-1)} className={`${arrowCls} left-0`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <div
        ref={scrollRef}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          // Soft fade where content continues, instead of a hard cut.
          maskImage: `linear-gradient(to right, ${canLeft ? 'transparent 0, #000 44px' : '#000 0'}, ${canRight ? '#000 calc(100% - 44px), transparent 100%' : '#000 100%'})`,
          WebkitMaskImage: `linear-gradient(to right, ${canLeft ? 'transparent 0, #000 44px' : '#000 0'}, ${canRight ? '#000 calc(100% - 44px), transparent 100%' : '#000 100%'})`,
        }}
      >
        <nav className={`flex items-center w-max mx-auto ${className}`}>{children}</nav>
      </div>
      {canRight && (
        <button type="button" aria-label="Scroll categories right" onClick={() => scrollBy(1)} className={`${arrowCls} right-0`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ShowcaseHeader({ isLoggedIn, collectionImages, menus, onOpenSearch }: ShowcaseHeaderProps) {
  const NAV_MENUS = menus && menus.length > 0 ? menus : DEFAULT_NAV_MENUS;
  const { totalQuantity, openDrawer } = useShowcaseCart();
  const { items: wishlistItems } = useWishlist();
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  const [isScrolled, setIsScrolled]           = useState(isHomepage ? false : true);
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const [mobileSection, setMobileSection]     = useState<string | null>(null);

  useEffect(() => {
    if (!isHomepage) { setIsScrolled(true); return; }
    const onScroll = () => setIsScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomepage]);

  const closeMobile = () => { setMobileMenuOpen(false); setMobileSection(null); };

  const flatLinkCls = (to: string) =>
    `whitespace-nowrap transition-colors duration-200 cursor-pointer py-1 hover:text-[#b89b6a] ${
      location.pathname === to
        ? isScrolled ? 'text-[#b89b6a]' : 'text-[#f4f0e8]'
        : ''
    }`;

  const navBaseCls = `gap-5 2xl:gap-9 text-[11px] uppercase tracking-[0.18em] font-medium leading-none transition-colors ${
    isScrolled ? 'text-[#5c544e]' : 'text-[#f4f0e8]/85'
  }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 font-sans ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#e5e0d8] py-4 sm:py-4.5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
          : 'bg-gradient-to-b from-[#241a16]/80 via-[#241a16]/30 to-transparent py-5 sm:py-6'
      }`}
    >
      <div className="max-w-[1800px] mx-auto px-5 lg:px-6 xl:px-10 2xl:px-14 flex items-center gap-3 lg:gap-4 xl:gap-6">

        {/* ── Logo ── */}
        <Link
          to="/"
          prefetch="intent"
          className="group flex items-center gap-3 sm:gap-3.5 shrink-0 cursor-pointer"
          aria-label="Urban Essentials Home"
        >
          <LogoMark
            className={`w-9 sm:w-11 shrink-0 transition-all duration-300 ${
              isScrolled ? 'text-[#241a16] group-hover:text-[#b89b6a]' : 'text-[#f4f0e8] group-hover:text-[#b89b6a]'
            }`}
          />
          <div className="flex flex-col justify-center">
            <span className={`whitespace-nowrap text-base sm:text-lg md:text-xl font-light tracking-[0.18em] xl:tracking-[0.24em] uppercase leading-tight transition-colors font-serif ${
              isScrolled ? 'text-[#241a16] group-hover:text-[#b89b6a]' : 'text-[#f4f0e8] group-hover:text-[#b89b6a]'
            }`}>
              URBAN ESSENTIALS
            </span>
            <span className={`hidden sm:block whitespace-nowrap text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.32em] leading-tight transition-colors font-medium mt-0.5 ${
              isScrolled ? 'text-[#8c7e73] group-hover:text-[#241a16]' : 'text-[#f4f0e8]/70 group-hover:text-[#f4f0e8]'
            }`}>
              Lifestyle &nbsp;|&nbsp; Travel &nbsp;|&nbsp; Home
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <ScrollableNav className={navBaseCls}>
          <Link to="/" prefetch="intent" className={`${flatLinkCls('/')} shrink-0`}>Home</Link>
          <Link to="/collections/all" prefetch="intent" className={`${flatLinkCls('/collections/all')} shrink-0`}>Shop</Link>
          <Link to="/collections" prefetch="intent" className={`${flatLinkCls('/collections')} shrink-0`}>Collection</Link>
          <Link to="/about" prefetch="intent" className={`${flatLinkCls('/about')} shrink-0`}>About</Link>
        </ScrollableNav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-3 sm:gap-3.5 shrink-0 ml-auto lg:ml-0">

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search"
            className="hidden sm:flex items-center justify-center hover:text-[#b89b6a] transition-colors cursor-pointer"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
            </svg>
          </button>

          <Link
            to="/account"
            prefetch="intent"
            aria-label="Account"
            className="hidden sm:flex items-center gap-2 hover:text-[#b89b6a] transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
            </svg>
            <span className="hidden 2xl:inline text-xs uppercase tracking-widest font-medium">
              {isLoggedIn ? (
                <Suspense fallback="Sign in">
                  <Await resolve={isLoggedIn} errorElement="Sign in">
                    {(loggedIn) => (loggedIn ? 'Account' : 'Sign in')}
                  </Await>
                </Suspense>
              ) : 'Sign in'}
            </span>
          </Link>

          <Link
            to="/wishlist"
            prefetch="intent"
            aria-label="Wishlist"
            className="relative hidden sm:flex items-center justify-center hover:text-[#b89b6a] transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center w-[18px] h-[18px] text-[11px] font-serif font-bold bg-[#b89b6a] text-[#241a16] rounded-full">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <button
            onClick={openDrawer}
            className="relative flex items-center space-x-2.5 px-4 sm:px-4 py-2 sm:py-2.5 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] transition-all duration-200 cursor-pointer shadow-md group"
            aria-label="Open Cart"
          >
            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#b89b6a] group-hover:text-[#f4f0e8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs tracking-wider uppercase hidden sm:inline font-semibold">Box</span>
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-serif font-bold bg-[#b89b6a] text-[#241a16] rounded-full">
              {totalQuantity}
            </span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 hover:text-[#b89b6a] transition-colors ${isScrolled ? 'text-[#241a16]' : 'text-[#f4f0e8]'}`}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#e5e0d8] px-6 py-5 shadow-lg max-h-[calc(100dvh-4.5rem)] overflow-y-auto">

          <div className="space-y-0.5 text-[11px] uppercase tracking-[0.2em] font-medium text-[#6d6560]">

            <Link to="/" prefetch="intent" onClick={closeMobile}
              className="block py-3 border-b border-[#e8e2d8] hover:text-[#241a16] transition-colors">
              Home
            </Link>

            <Link to="/collections/all" prefetch="intent" onClick={closeMobile}
              className="block py-3 border-b border-[#e8e2d8] hover:text-[#241a16] transition-colors">
              Shop
            </Link>

            <Link to="/collections" prefetch="intent" onClick={closeMobile}
              className="block py-3 border-b border-[#e8e2d8] hover:text-[#241a16] transition-colors">
              Collection
            </Link>

            <Link to="/about" prefetch="intent" onClick={closeMobile}
              className="block py-3 border-b border-[#e8e2d8] hover:text-[#241a16] transition-colors">
              About
            </Link>
          </div>

          <div className="pt-4 mt-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-[#8c7e73]">
            <button type="button" onClick={() => { closeMobile(); onOpenSearch(); }}
              className="hover:text-[#241a16] transition-colors cursor-pointer">
              Search
            </button>
            <Link to="/wishlist" prefetch="intent" onClick={closeMobile} className="hover:text-[#241a16] transition-colors">
              Wishlist{wishlistItems.length > 0 ? ` (${wishlistItems.length})` : ''}
            </Link>
            <Link to="/account" prefetch="intent" onClick={closeMobile} className="hover:text-[#241a16] transition-colors">
              {isLoggedIn ? (
                <Suspense fallback="Sign in">
                  <Await resolve={isLoggedIn} errorElement="Sign in">
                    {(loggedIn) => (loggedIn ? 'Account' : 'Sign in')}
                  </Await>
                </Suspense>
              ) : 'Sign in'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
