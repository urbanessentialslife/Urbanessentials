import { Link } from 'react-router';

interface Crumb {
  label: string;
  to?: string;
}

/** Shared breadcrumb nav — used on product, shop/category, and journal pages
 * so navigation reads the same way everywhere instead of each route hand-
 * rolling its own markup and (previously) drifting on color/contrast. */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-1.5 text-[11px] uppercase tracking-widest text-[#6d6560]">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.to ? (
              <Link to={item.to} prefetch="intent" className="hover:text-[#241a16] transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#241a16] font-medium normal-case tracking-normal" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
