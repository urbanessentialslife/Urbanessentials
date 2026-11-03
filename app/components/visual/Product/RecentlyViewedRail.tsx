import { formatAmount } from '~/lib/money';
import { Link } from 'react-router';
import { Image } from '@shopify/hydrogen';
import { useRecentlyViewed } from '~/context/RecentlyViewedContext';
import { LogoMark } from '~/components/visual/Common/Logo';

interface RecentlyViewedRailProps {
  /** Exclude the product currently being viewed (its own page) from the rail. */
  excludeId?: string;
}

export function RecentlyViewedRail({ excludeId }: RecentlyViewedRailProps) {
  const { items } = useRecentlyViewed();
  const visible = items.filter((p) => p.id !== excludeId);

  if (visible.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 pb-24">
      <div className="mb-8">
        <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
          Your History
        </span>
        <h2 className="text-2xl md:text-3xl font-serif font-light text-[#241a16] mt-2">
          Recently Viewed
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {visible.slice(0, 4).map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.handle}`}
            prefetch="intent"
            className="group flex flex-col rounded-2xl bg-white border border-[#c9c2b8] hover:border-[#b89b6a] overflow-hidden transition-colors"
          >
            <div className="aspect-square overflow-hidden bg-[#e8e1d4]">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <LogoMark className="w-8 h-10 text-[#241a16]/15" />
                </div>
              )}
            </div>
            <div className="p-3.5">
              <p className="text-sm font-medium text-[#241a16] tracking-tight truncate">{product.title}</p>
              <p className="text-base font-serif font-bold text-[#241a16] mt-0.5">
                {product.currencySymbol}
                {formatAmount(product.price, product.currencySymbol)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
