import { Link } from 'react-router';
import { Image } from '@shopify/hydrogen';
import { useCompare } from '~/context/CompareContext';

/** Floating sitewide bar that surfaces once 2+ products are flagged for
 * comparison from any card — stays out of the way (and off-screen) otherwise. */
export function CompareBar() {
  const { items, removeFromCompare, clearCompare } = useCompare();

  if (items.length < 2) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 font-sans animate-fade-in">
      <div className="max-w-3xl mx-auto mb-4 px-4">
        <div className="bg-[#241a16] text-[#f4f0e8] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center -space-x-2 shrink-0">
            {items.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="relative w-9 h-9 rounded-full border-2 border-[#241a16] bg-[#f4f0e8] overflow-hidden group"
              >
                {product.image ? (
                  <Image src={product.image} alt={product.title} width={36} height={36} className="w-full h-full object-cover" />
                ) : null}
                <button
                  type="button"
                  onClick={() => removeFromCompare(product.id)}
                  aria-label={`Remove ${product.title} from comparison`}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <span className="text-xs text-[#dfc08a] flex-1 min-w-0 truncate">
            {items.length} {items.length === 1 ? 'product' : 'products'} to compare
          </span>

          <button
            type="button"
            onClick={clearCompare}
            className="text-[11px] uppercase tracking-wider text-[#f4f0e8]/60 hover:text-[#f4f0e8] transition shrink-0 cursor-pointer"
          >
            Clear
          </button>

          <Link
            to="/compare"
            className="shrink-0 px-4 py-2 rounded-full bg-[#dfc08a] hover:bg-[#ecd9ab] text-[#241a16] text-[11px] uppercase tracking-widest font-semibold transition-colors"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
