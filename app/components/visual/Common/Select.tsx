import { useCallback, useEffect, useId, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Visible label text. Used as the accessible name; shown inline when `showLabel`. */
  label: string;
  showLabel?: boolean;
  /** Submits with a surrounding <form> under this name. */
  name?: string;
  id?: string;
  /** `pill` = compact toolbar control, `field` = full-width form field. */
  variant?: 'pill' | 'field';
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Brand dropdown replacing the browser's native <select> popup. Fully
 * keyboard operable (arrows, Home/End, Enter/Space, Esc, type-ahead by
 * first letter) and announced as a listbox.
 */
export function Select({ options, value, onChange, label, showLabel = false, name, id, variant = 'pill', align = 'right', className = '' }: SelectProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  const openList = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(options[index].value);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1) {
          const next = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
          if (next >= 0) setActiveIndex(next);
        }
    }
  };

  const triggerCls =
    variant === 'field'
      ? 'w-full justify-between rounded-lg bg-white px-4 py-2.5 text-sm'
      : 'rounded-full bg-transparent pl-4 pr-3 py-2 text-xs';

  return (
    <div ref={rootRef} className={`relative inline-block ${variant === 'field' ? 'w-full' : ''} ${className}`}>
      {showLabel && (
        <span id={`${baseId}-label`} className="mr-3 text-[11px] uppercase tracking-[0.2em] text-[#6d6560]">
          {label}
        </span>
      )}
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={buttonRef}
        id={`${baseId}-button`}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${baseId}-list`}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? `${baseId}-label ${baseId}-button` : undefined}
        aria-activedescendant={open ? `${baseId}-opt-${activeIndex}` : undefined}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        className={`inline-flex items-center gap-3 border text-[#241a16] cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b89b6a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f0e8] ${
          open ? 'border-[#241a16]' : 'border-[#c9c2b8] hover:border-[#241a16]'
        } ${triggerCls}`}
      >
        <span className={variant === 'pill' ? 'font-medium tracking-wide' : ''}>{selected?.label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 text-[#6d6560] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <ul
          id={`${baseId}-list`}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className={`absolute z-50 mt-2 min-w-full w-max max-w-[min(20rem,90vw)] overflow-hidden rounded-xl border border-[#c9c2b8] bg-[#fbf9f4] py-1.5 shadow-[0_18px_40px_rgba(36,26,22,0.14)] animate-[navDropIn_0.16s_ease-out] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isActive = i === activeIndex;
            return (
              // Keyboard selection is handled on the listbox (arrow keys/Enter).
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={option.value}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-6 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-[#efe9dd] text-[#241a16]' : 'text-[#5c544e]'
                } ${isSelected ? 'font-semibold text-[#241a16]' : ''}`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 text-[#b89b6a]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6.4l2.3 2.3 4.7-5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
