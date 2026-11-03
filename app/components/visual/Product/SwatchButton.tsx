interface SwatchButtonProps {
  color: string;
  selected: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  /** Dot diameter in px; the clickable ring is always 12px larger. */
  size?: number;
  /** Full Tailwind classes for the selected ring — pass a light one on dark backgrounds. */
  activeRingClass?: string;
}

/**
 * Colour swatch with a fixed footprint. The selection ring is drawn on the
 * button's own box rather than by scaling the dot up or adding a ring-offset,
 * so selecting a swatch never grows into the label above it or its
 * neighbours — and the hover/selected states can't overlap each other.
 */
export function SwatchButton({ color, selected, disabled, title, onClick, size = 24, activeRingClass = 'ring-2 ring-[#241a16]' }: SwatchButtonProps) {
  const box = size + 12;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={selected}
      style={{ width: box, height: box }}
      className={`shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-shadow duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${
        selected
          ? activeRingClass
          : 'ring-1 ring-transparent hover:ring-[#a69686]'
      }`}
    >
      <span
        className="block rounded-full border border-black/10"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </button>
  );
}
