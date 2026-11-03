interface BlobAccentProps {
  color?: string;
  className?: string;
}

/** Soft, blurred organic shape used as a quiet background accent behind a
 * section heading — breaks up a flat single-color section without adding
 * any real visual weight (it's pure decoration, aria-hidden, and sits
 * behind the content in z-order). */
export function BlobAccent({ color = '#b89b6a', className = '' }: BlobAccentProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none -z-10 blur-3xl opacity-20 ${className}`}
      style={{
        background: color,
        borderRadius: '42% 58% 65% 35% / 45% 40% 60% 55%',
      }}
    />
  );
}
