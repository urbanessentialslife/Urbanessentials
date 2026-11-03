import React from 'react';
import { Link, useFetcher, useLocation, useRouteLoaderData, useSubmit } from 'react-router';
import type { RootLoader } from '~/root';
import { LogoMark } from './Logo';
import { Select } from './Select';

export function ShowcaseFooter() {
  const socialLinks = useRouteLoaderData<RootLoader>('root')?.socialLinks ?? [];
  const newsletterFetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const isSubscribing = newsletterFetcher.state !== 'idle';
  const subscribed = newsletterFetcher.data?.ok;
  const subscribeError = newsletterFetcher.data?.error;

  return (
    <footer className="bg-[#c9c2b8] text-[#241a16] border-t border-[#c9c2b8] font-sans pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#c9c2b8]">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <LogoMark className="w-8 text-[#241a16]" />
              <h3 className="text-xl font-serif tracking-[0.2em] uppercase text-[#241a16] font-medium">
                URBAN ESSENTIALS
              </h3>
            </div>
            <p className="text-sm text-[#6d6560] font-light leading-relaxed max-w-sm">
              Thoughtful gifts. Made memorable. Sculptural everyday objects engineered with architectural precision and presented in keepsake unboxing rituals.
            </p>
            <div className="pt-2 text-xs uppercase tracking-widest text-[#a69686] font-medium">
              Lifestyle &nbsp;|&nbsp; Travel &nbsp;|&nbsp; Home
            </div>
          </div>

          {/* Nav: Shop */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#241a16] font-semibold">
              Shop
            </h4>
            <ul className="space-y-2 text-xs text-[#6d6560]">
              <li><Link to="/products/the-coffee-cup" prefetch="intent" className="hover:text-[#241a16] transition">The Urban Tumbler</Link></li>
              <li><Link to="/collections/all" prefetch="intent" className="hover:text-[#241a16] transition">Shop</Link></li>
              <li><Link to="/collections" prefetch="intent" className="hover:text-[#241a16] transition">Categories</Link></li>
            </ul>
          </div>

          {/* Nav: Support */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#241a16] font-semibold">
              Support
            </h4>
            <ul className="space-y-2 text-xs text-[#6d6560]">
              <li><Link to="/faq" className="hover:text-[#241a16] transition">FAQ</Link></li>
              <li><Link to="/track-order" className="hover:text-[#241a16] transition">Track Your Order</Link></li>
              <li><Link to="/returns" className="hover:text-[#241a16] transition">Returns & Exchanges</Link></li>
              <li><Link to="/policies" className="hover:text-[#241a16] transition">Policies</Link></li>
              <li><Link to="/blogs" className="hover:text-[#241a16] transition">Journal & Stories</Link></li>
            </ul>
          </div>

          {/* Social & Newsletter Column */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#241a16] font-semibold">
              Private Journal
            </h4>
            <p className="text-xs text-[#6d6560] leading-relaxed">
              Receive limited edition release invitations and private gifting insights.
            </p>
            {subscribed ? (
              <p className="text-xs text-emerald-700 font-medium py-2.5">
                You&apos;re on the list — thank you.
              </p>
            ) : (
              <newsletterFetcher.Form
                method="post"
                action="/api/newsletter"
                className="group relative flex w-full items-center rounded-full bg-[#f4f0e8] hover:bg-white border border-[#241a16]/15 hover:border-[#241a16]/30 focus-within:border-[#241a16] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#241a16]/10 shadow-sm transition-all duration-300 p-1.5 pl-5 pr-1.5 my-3 sm:my-4"
              >
                {/* Honeypot — hidden from real visitors via CSS (not `type="hidden"`,
                    which most bots already know to skip); a filled-in value marks
                    the submission as a bot in api.newsletter.tsx. */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute w-0 h-0 opacity-0 pointer-events-none"
                />
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  style={{ border: 'none', outline: 'none', background: 'transparent', margin: 0, padding: 0 }}
                  className="min-w-0 flex-1 text-xs sm:text-[13px] font-sans bg-transparent text-[#241a16] placeholder-[#a69686] border-0 outline-none focus:outline-none focus:ring-0 shadow-none m-0 py-2.5 pr-2"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="shrink-0 w-9 h-9 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#dfc08a] hover:text-[#f4f0e8] flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label="Subscribe to Private Journal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </newsletterFetcher.Form>
            )}
            {subscribeError && (
              <p className="text-xs text-red-600 font-medium">{subscribeError}</p>
            )}
            {/* Social links — each set via env (PUBLIC_INSTAGRAM_URL etc.);
                hidden entirely until at least one is configured. */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-[#a69686]">
                {socialLinks.map((link, i) => (
                  <React.Fragment key={link.label}>
                    {i > 0 && <span className="text-[#a69686]/40">•</span>}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#241a16] transition text-xs uppercase tracking-widest font-medium"
                    >
                      {link.label}
                    </a>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#a69686] space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} UrbanEssentials Pvt. Ltd. All rights reserved.
          </div>
          <CountrySelector />
          <div className="flex space-x-6 text-[11px] tracking-wider uppercase font-medium">
            <Link to="/policies/privacy-policy" className="hover:text-[#241a16] transition">Privacy Policy</Link>
            <Link to="/policies/terms-of-service" className="hover:text-[#241a16] transition">Terms of Service</Link>
            <Link to="/policies/refund-policy" className="hover:text-[#241a16] transition">Satisfaction Guarantee</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

/**
 * Ships-to / currency picker. Renders nothing until a second country is
 * enabled in Shopify Admin → Settings → Markets, so a single-market shop
 * looks exactly as before.
 */
function CountrySelector() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const submit = useSubmit();
  const location = useLocation();
  const localization = rootData?.localization;
  const countries = localization?.availableCountries ?? [];

  if (!localization || countries.length < 2) return null;

  const options = [...countries]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      value: c.isoCode,
      label: `${c.name} (${c.currency.isoCode} ${c.currency.symbol})`,
    }));

  return (
    <Select
      id="footer-country"
      label="Country / currency"
      variant="pill"
      align="left"
      value={localization.country.isoCode}
      options={options}
      onChange={(country) =>
        void submit(
          { country, redirectTo: `${location.pathname}${location.search}` },
          { method: 'post', action: '/api/country' },
        )
      }
    />
  );
}
