import { formatAmount } from '~/lib/money';
import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {Route} from './+types/wishlist';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';
import {LogoMark} from '~/components/visual/Common/Logo';
import {useWishlist} from '~/context/WishlistContext';
import {useShowcaseCart} from '~/context/ShowcaseCartContext';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Wishlist | UrbanEssentials'},
    {name: 'description', content: 'Your saved UrbanEssentials pieces.'},
  ];
};

export default function Wishlist() {
  const {items, removeFromWishlist} = useWishlist();
  const {addItem} = useShowcaseCart();

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-28 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb items={[{label: 'Home', to: '/'}, {label: 'Wishlist'}]} className="mb-6" />
        <div className="mb-10">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            Saved for Later
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">Wishlist</h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 space-y-4">
            <LogoMark className="w-10 h-12 text-[#241a16]/15" />
            <h2 className="text-lg font-light text-[#241a16]">Your wishlist is empty</h2>
            <p className="text-sm text-[#6d6560] max-w-xs">
              Tap the heart on any product to save it here for later.
            </p>
            <Link
              to="/collections/all"
              className="mt-2 px-6 py-2.5 text-xs uppercase tracking-widest bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] rounded-full transition-all duration-200 font-medium"
            >
              Browse the Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((product) => {
              const defaultVariant =
                product.variants.find((v) => v.id === product.defaultVariantId) ?? product.variants[0];
              return (
                <div
                  key={product.id}
                  className="group flex flex-col rounded-2xl bg-white border border-[#c9c2b8] hover:border-[#b89b6a] overflow-hidden transition-colors"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#e8e1d4]">
                    <Link to={`/products/${product.handle}`} prefetch="intent" className="absolute inset-0 block">
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
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product.id)}
                      aria-label={`Remove ${product.title} from wishlist`}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#6d6560] hover:text-[#b5402f] flex items-center justify-center text-sm cursor-pointer shadow-sm transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <Link
                        to={`/products/${product.handle}`}
                        prefetch="intent"
                        className="text-sm font-medium text-[#241a16] tracking-tight truncate block hover:text-[#b89b6a] transition-colors"
                      >
                        {product.title}
                      </Link>
                      <p className="text-base font-serif font-bold text-[#241a16] mt-0.5">
                        {product.currencySymbol}
                        {formatAmount(product.price, product.currencySymbol)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem(product, defaultVariant.id, 1)}
                      disabled={!defaultVariant.inStock}
                      className="w-full py-2 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-[10px] uppercase tracking-widest font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {defaultVariant.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
