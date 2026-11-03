interface HeadlineLine {
  text: string;
  /** 'light' for a small connecting phrase, 'bold' for the emphasized word/phrase. */
  weight: 'light' | 'bold';
}

interface DisplayHeadlineProps {
  lines: HeadlineLine[];
  className?: string;
  /** Text color for 'bold' lines; 'light' lines always render at reduced opacity of this color. */
  color?: string;
}

/** Alternating thin/bold line rhythm for a manifesto-style moment — a
 * handful of short connecting phrases building up to the emphasized
 * word(s), each on its own line. Reserved for the one or two biggest
 * typographic beats on the site (the cinematic hero reveal) rather than
 * every heading — the eyebrow+h2 pattern used everywhere else already
 * carries the same thin/bold contrast at a quieter scale. */
export function DisplayHeadline({ lines, className = '', color = '#fdfaf5' }: DisplayHeadlineProps) {
  return (
    <div className={`font-serif leading-[1.05] ${className}`} style={{ color }}>
      {lines.map((line, i) => (
        <div
          key={i}
          className={
            line.weight === 'bold'
              ? 'text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight'
              : 'text-lg sm:text-xl md:text-2xl font-light opacity-70'
          }
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}
