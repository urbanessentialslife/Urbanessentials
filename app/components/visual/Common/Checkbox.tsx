import { useId } from 'react';

interface CheckboxProps {
  label: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  id?: string;
  /** Small trailing number, e.g. how many products match. */
  count?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Brand checkbox: the native input stays in the DOM (keyboard, form
 * submission and screen readers all work) but is visually replaced by a
 * crisp square with a drawn tick.
 */
export function Checkbox({ label, checked, defaultChecked, onChange, name, id, count, disabled, className = '' }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={`group flex items-center gap-3 select-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <input
        id={inputId}
        name={name}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border border-[#a69686] bg-white transition-all duration-150 group-hover:border-[#241a16] peer-checked:border-[#241a16] peer-checked:bg-[#241a16] peer-focus-visible:ring-2 peer-focus-visible:ring-[#b89b6a] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#f4f0e8] peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100"
      >
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3 scale-50 text-[#f4f0e8] opacity-0 transition-all duration-150"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.4l2.3 2.3 4.7-5" />
        </svg>
      </span>
      <span className="flex-1 text-sm text-[#5c544e] transition-colors group-hover:text-[#241a16] peer-checked:text-[#241a16] peer-checked:font-medium">
        {label}
      </span>
      {typeof count === 'number' && <span className="font-num text-[11px] text-[#a69686]">{count}</span>}
    </label>
  );
}
