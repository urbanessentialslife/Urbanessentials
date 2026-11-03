import { useEffect, useRef } from 'react';
import { useDialogTransition } from '~/hooks/useDialogTransition';

interface SizeGuideModalProps {
  /** The current product's own capacity spec, if it has one (e.g. "300 ml / 10 oz"). */
  capacity?: string;
  onClose: () => void;
}

const CAPACITY_REFERENCE = [
  { range: '250–300 ml', use: 'A single cup of coffee or tea — compact, pocket/bag friendly.' },
  { range: '350–500 ml', use: 'A standard everyday drink — most common tumbler size.' },
  { range: '700–1000 ml', use: 'Half a day’s hydration — gym, desk, or travel.' },
  { range: '1200 ml+', use: 'A full day’s carry, or shared pours on the go.' },
];

/** Drinkware doesn't have a clothing-style size chart, so this is a
 * capacity reference instead — what a given ml/oz figure actually holds in
 * everyday terms, plus this product's own capacity highlighted. */
export function SizeGuideModal({ capacity, onClose }: SizeGuideModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { handleClose } = useDialogTransition(dialogRef, onClose, {
    enterFrom: { opacity: 0, scale: 0.94, y: 20 },
    isOpen: true,
  });

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

  // Escape is handled by the window keydown listener above; the backdrop and
  // panel click handlers are mouse-only conveniences.
  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions */
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Capacity guide"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241a16]/70 backdrop-blur-md p-4 sm:p-8"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#f4f0e8] rounded-3xl shadow-2xl p-6 sm:p-8"
      >
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          aria-label="Close capacity guide"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
        >
          <svg className="w-4 h-4 text-[#241a16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
          Choosing a Capacity
        </span>
        <h3 className="text-2xl font-serif font-light text-[#241a16] mt-2 mb-1">Capacity Guide</h3>

        {capacity && (
          <p className="text-sm text-[#241a16] bg-white border border-[#b89b6a] rounded-xl px-4 py-2.5 mt-4 mb-2 font-medium">
            This piece holds <span className="text-[#b89b6a]">{capacity}</span>
          </p>
        )}

        <div className="mt-5 space-y-3">
          {CAPACITY_REFERENCE.map((row) => (
            <div key={row.range} className="flex gap-4 py-3 border-t border-[#c9c2b8] first:border-t-0 first:pt-0">
              <span className="text-xs font-semibold text-[#241a16] uppercase tracking-wide shrink-0 w-28">
                {row.range}
              </span>
              <span className="text-xs text-[#6d6560] leading-relaxed">{row.use}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#a69686] mt-5 leading-relaxed">
          Still unsure? Every product page lists its exact capacity under Specifications — reach out
          from our <a href="/returns" className="underline hover:text-[#241a16] transition-colors">support page</a> if
          you&apos;d like a hand choosing.
        </p>
      </div>
    </div>
  );
  /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions */
}
