import { formatAmount } from '~/lib/money';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Await } from 'react-router';
import { Image } from '@shopify/hydrogen';
import { useShowcaseCart } from '~/context/ShowcaseCartContext';
import { useDialogTransition } from '~/hooks/useDialogTransition';
import { CheckoutSignInPrompt } from './CheckoutSignInPrompt';

interface ShowcaseCartDrawerProps {
  isLoggedIn?: Promise<boolean>;
}

export function ShowcaseCartDrawer({ isLoggedIn }: ShowcaseCartDrawerProps) {
  const {
    items,
    totalQuantity,
    subtotal,
    currencySymbol,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    checkout,
    isCheckingOut,
    checkoutError,
    checkoutWarning,
    proceedToCheckout,
    giftNote,
    setGiftNote,
    discountCode,
    setDiscountCode,
  } = useShowcaseCart();

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingCode, setIsAddingCode] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { handleClose, isClosing } = useDialogTransition(panelRef, closeDrawer, {
    enterFrom: { opacity: 0, x: 60 },
    isOpen: isDrawerOpen,
  });

  // Focus management: move focus into the drawer on open, restore it on close,
  // and let Escape close it like any other dialog.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      // preventScroll matters here — restoring focus to the tile that
      // opened the drawer would otherwise let the browser's default
      // focus-scroll nudge the page out from under the visitor.
      previouslyFocused?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Gifting box cart"
          className="w-screen max-w-md bg-[#f4f0e8] text-[#241a16] border-l border-[#c9c2b8] shadow-2xl flex flex-col justify-between"
        >

          {/* Header */}
          <div className="p-6 border-b border-[#c9c2b8] flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-light tracking-wide uppercase font-serif text-[#241a16]">
                Gifting Box
              </h2>
              <span className="px-2.5 py-0.5 text-xs tracking-widest uppercase bg-[#f4f0e8] rounded-full text-[#6d6560] font-semibold">
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="p-2 text-[#6d6560] hover:text-[#241a16] transition-colors duration-200 rounded-full hover:bg-[#f4f0e8]"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isCheckingOut ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full border-2 border-[#c9c2b8] border-t-[#241a16] animate-spin" />
                <h3 className="text-lg font-light text-[#241a16]">Taking you to checkout…</h3>
                <p className="text-sm text-[#6d6560] max-w-xs">
                  Redirecting to secure checkout.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#f4f0e8] flex items-center justify-center text-[#a69686]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-light text-[#241a16]">Your gifting box is empty</h3>
                <p className="text-sm text-[#6d6560] max-w-xs">
                  Discover our architectural tumblers and curated gift ensembles above.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2.5 text-xs uppercase tracking-widest bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] rounded-full transition-all duration-200 font-medium"
                >
                  Explore the Collection
                </button>
              </div>
            ) : (
              <>
                {/* Item List */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white border border-[#c9c2b8] flex space-x-4 transition-all hover:border-[#b89b6a] shadow-sm"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-20 h-24 rounded-xl bg-[#f4f0e8] overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={item.variant.image || item.product.image}
                          alt={item.product.title}
                          width={80}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white"
                          style={{ backgroundColor: item.variant.colorHex }}
                          title={item.variant.name}
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-[#241a16]">
                              {item.product.title}
                            </h4>
                            <span className="text-lg font-serif font-bold text-[#241a16]">
                              {currencySymbol}
                              {formatAmount(
                                (item.product.price +
                                  (item.customName && item.product.customization?.enabled
                                    ? item.product.customization.feeAmount
                                    : 0)) *
                                  item.quantity,
                                currencySymbol,
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-[#6d6560] mt-0.5 font-medium">
                            Edition: <span className="text-[#241a16]">{item.variant.name}</span>
                          </p>
                          {item.customName && item.product.customization?.enabled && (
                            <p className="text-xs text-[#6d6560] mt-0.5 font-medium">
                              Customized by <span className="text-[#241a16]">&ldquo;{item.customName}&rdquo;</span>
                              <span className="text-xs font-serif font-semibold">
                                {' '}(+{currencySymbol}
                                {formatAmount(item.product.customization.feeAmount, currencySymbol)})
                              </span>
                            </p>
                          )}
                          {item.customName &&
                            item.product.customization?.enabled &&
                            item.product.customization.shippingDays > 0 && (
                              <p className="text-[10px] text-[#6d6560] mt-0.5 uppercase tracking-wide font-medium">
                                Ships in +{item.product.customization.shippingDays} days
                              </p>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-[#c9c2b8] rounded-lg overflow-hidden bg-[#f4f0e8]">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2.5 py-1 text-[#6d6560] hover:text-[#241a16] hover:bg-[#c9c2b8] text-xs transition cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="px-3 py-1 text-sm font-serif font-bold text-[#241a16]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2.5 py-1 text-[#6d6560] hover:text-[#241a16] hover:bg-[#c9c2b8] text-xs transition cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-red-600/70 hover:text-red-700 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Packaging Experience Banner */}
                <div className="p-4 rounded-2xl bg-[#f4f0e8] border border-[#c9c2b8] space-y-2">
                  <div className="flex items-center space-x-2 text-[#a69686] text-xs uppercase tracking-wider font-semibold">
                    <svg className="w-4 h-4 text-[#a69686]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span>Complimentary Gifting Presentation</span>
                  </div>
                  <p className="text-xs text-[#6d6560] leading-relaxed">
                    Includes rigid matte magnetic box, gold-foil monogram stamping, and custom wax-sealed greeting card.
                  </p>
                </div>

                {/* Handwritten Card Note Input */}
                <div className="space-y-2">
                  <button
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="flex items-center justify-between w-full text-xs text-[#6d6560] hover:text-[#241a16] transition py-1 font-medium cursor-pointer"
                  >
                    <span>{isAddingNote ? '− Hide Gift Note' : '+ Add Handwritten Card Note'}</span>
                    <span className="text-[10px] text-[#a69686] uppercase tracking-wider font-semibold">Free</span>
                  </button>
                  {isAddingNote && (
                    <textarea
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      placeholder="Write your personal message here. We will scribe it by hand on cotton deckled-edge paper..."
                      className="w-full text-xs bg-white border border-[#c9c2b8] rounded-xl p-3 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition h-20 resize-none shadow-sm"
                    />
                  )}
                </div>

                {/* Promo / Discount Code Input */}
                <div className="space-y-2">
                  <button
                    onClick={() => setIsAddingCode(!isAddingCode)}
                    className="flex items-center justify-between w-full text-xs text-[#6d6560] hover:text-[#241a16] transition py-1 font-medium cursor-pointer"
                  >
                    <span>{isAddingCode || discountCode ? '− Hide Promo Code' : '+ Have a Promo Code?'}</span>
                    {discountCode && !isAddingCode && (
                      <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">
                        &ldquo;{discountCode}&rdquo; ready to apply
                      </span>
                    )}
                  </button>
                  {isAddingCode && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="e.g. WELCOME10"
                        className="flex-1 min-w-0 text-xs bg-white border border-[#c9c2b8] rounded-xl px-3 py-2.5 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition shadow-sm uppercase"
                      />
                      {discountCode && (
                        <button
                          onClick={() => setDiscountCode('')}
                          className="shrink-0 text-xs text-[#6d6560] hover:text-[#241a16] transition px-1 cursor-pointer"
                          aria-label="Clear promo code"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                  {isAddingCode && (
                    <p className="text-[10px] text-[#a69686]">
                      Applied automatically at checkout — Shopify will validate it there.
                    </p>
                  )}
                </div>

                {/* Opt-in sign-in — entirely skippable, guest checkout works
                    exactly the same without it (see ShowcaseCartContext). */}
                {isLoggedIn && (
                  <Suspense fallback={null}>
                    <Await resolve={isLoggedIn}>
                      {(loggedIn) => (loggedIn ? null : <CheckoutSignInPrompt />)}
                    </Await>
                  </Suspense>
                )}
              </>
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && !isCheckingOut && (
            <div className="p-6 border-t border-[#c9c2b8] bg-white space-y-4">
              <div className="space-y-1.5 text-xs text-[#6d6560]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#241a16] text-xl font-serif font-bold">
                    {currencySymbol}
                    {formatAmount(subtotal, currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-[#6d6560]">
                  <span>White-Glove Courier Delivery</span>
                  <span className="text-emerald-600 font-medium">Complimentary</span>
                </div>
                <div className="flex justify-between text-[#6d6560]">
                  <span>Luxury Box & Wax Seal</span>
                  <span className="text-emerald-600 font-medium">Included</span>
                </div>
              </div>

              {checkoutError && (
                <p className="text-xs text-red-600 font-medium">{checkoutError}</p>
              )}

              {checkoutWarning && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium">
                  {checkoutWarning}
                </p>
              )}

              <div className="pt-2">
                {checkoutWarning ? (
                  <button
                    onClick={proceedToCheckout}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] font-medium text-xs uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center space-x-2 group cursor-pointer"
                  >
                    <span>Continue to Checkout</span>
                    <svg
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => { void checkout(); }}
                    disabled={isCheckingOut}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] font-medium text-xs uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center space-x-2 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>Proceed to Checkout</span>
                    <svg
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
                <div className="flex items-center justify-center gap-1.5 mt-2.5">
                  <svg className="w-3 h-3 text-[#b89b6a]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[10px] text-center text-[#6d6560] uppercase tracking-wider font-semibold">
                    Fastrr 1-Click Checkout · UPI, Cards & COD
                  </p>
                </div>
                <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2">
                  {['Visa', 'Mastercard', 'RuPay', 'UPI', 'Net Banking'].map((method) => (
                    <span
                      key={method}
                      className="px-2 py-0.5 rounded border border-[#c9c2b8] text-[9px] uppercase tracking-wide text-[#6d6560] font-medium"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
