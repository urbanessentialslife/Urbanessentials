import React from 'react';

interface LogoMarkProps {
  className?: string;
}

/**
 * The real Urban Essentials interlocking U/E monogram artwork, applied as a
 * `currentColor` CSS mask rather than an <img> — every call site already
 * passes a color/opacity/hover className (e.g. "text-[#241a16]/15",
 * "text-white/20", "group-hover:text-[#b89b6a]"), and masking lets all of
 * that keep working unchanged against the new shape, instead of needing
 * pre-baked color variants or per-site rewrites.
 */
export function LogoMark({className = 'w-8'}: LogoMarkProps) {
  // The artwork is wide (443x308), so the box takes its height from the
  // width via aspect-ratio. Any `h-*` a call site passes is dropped — a
  // tall w-6 h-7 box used to leave the mark floating tiny and squat inside.
  const sizing = className.replace(/(^|\s)(?:[\w-]+:)*h-\S+/g, ' ');
  return (
    <span
      role="img"
      aria-label="Urban Essentials monogram"
      className={`inline-block bg-current shrink-0 aspect-[443/308] ${sizing}`}
      style={{
        WebkitMaskImage: 'url(/images/brand/monogram-dark.png)',
        maskImage: 'url(/images/brand/monogram-dark.png)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  compact?: boolean;
}

/** Monogram + wordmark lockup, matching the brand guidelines' horizontal logo construction. */
export function Logo({
  className = 'flex items-center gap-2.5',
  markClassName = 'w-5 h-6',
  wordmarkClassName = 'text-xs uppercase tracking-[0.3em] font-medium leading-none',
  compact = false,
}: LogoProps) {
  return (
    <div className={className}>
      <LogoMark className={markClassName} />
      <div className={wordmarkClassName}>
        <span>URBAN</span>
        {!compact && <span className="block">ESSENTIALS</span>}
        {compact && <span> ESSENTIALS</span>}
      </div>
    </div>
  );
}
