import { formatAmount } from '~/lib/money';
import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {Route} from './+types/compare';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';
import {LogoMark} from '~/components/visual/Common/Logo';
import {useCompare} from '~/context/CompareContext';
import {useShowcaseCart} from '~/context/ShowcaseCartContext';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Compare Products | UrbanEssentials'},
    {name: 'description', content: 'Compare UrbanEssentials products side by side.'},
  ];
};

export default function Compare() {
  const {items, removeFromCompare, clearCompare} = useCompare();
  const {addItem} = useShowcaseCart();

  const specLabels = Array.from(
    new Set(items.flatMap((product) => product.specs.map((spec) => spec.label))),
  );

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-28 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb items={[{label: 'Home', to: '/'}, {label: 'Compare'}]} className="mb-6" />
        <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
              Side by Side
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">
              Compare Products
            </h1>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCompare}
              className="text-xs uppercase tracking-widest text-[#6d6560] hover:text-[#241a16] transition cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 space-y-4">
            <LogoMark className="w-10 h-12 text-[#241a16]/15" />
            <h2 className="text-lg font-light text-[#241a16]">Nothing to compare yet</h2>
            <p className="text-sm text-[#6d6560] max-w-xs">
              Tap &ldquo;Compare&rdquo; on any product card in the shop to add it here — pick at least two.
            </p>
            <Link
              to="/collections/all"
              className="mt-2 px-6 py-2.5 text-xs uppercase tracking-widest bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] rounded-full transition-all duration-200 font-medium"
            >
              Browse the Shop
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-40" />
                  {items.map((product) => (
                    <th key={product.id} className="align-top p-3 text-left min-w-[200px]">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => removeFromCompare(product.id)}
                          aria-label={`Remove ${product.title}`}
                          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/90 text-[#6d6560] hover:text-[#241a16] flex items-center justify-center text-xs cursor-pointer shadow-sm"
                        >
                          ×
                        </button>
                        <Link to={`/products/${product.handle}`} className="block aspect-square rounded-2xl overflow-hidden bg-white border border-[#c9c2b8]">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.title}
                              sizes="200px"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <LogoMark className="w-8 h-10 text-[#241a16]/15" />
                            </div>
                          )}
                        </Link>
                        <Link
                          to={`/products/${product.handle}`}
                          className="block mt-3 text-sm font-medium text-[#241a16] hover:text-[#b89b6a] transition-colors"
                        >
                          {product.title}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-t border-[#c9c2b8]">
                  <td className="p-3 text-xs uppercase tracking-widest text-[#6d6560]">Price</td>
                  {items.map((product) => (
                    <td key={product.id} className="p-3 text-lg font-serif font-bold text-[#241a16]">
                      {product.currencySymbol}
                      {formatAmount(product.price, product.currencySymbol)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[#c9c2b8]">
                  <td className="p-3 text-xs uppercase tracking-widest text-[#6d6560]">Availability</td>
                  {items.map((product) => (
                    <td key={product.id} className="p-3 text-[#241a16]">
                      {product.availability}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[#c9c2b8]">
                  <td className="p-3 text-xs uppercase tracking-widest text-[#6d6560]">Finishes</td>
                  {items.map((product) => (
                    <td key={product.id} className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {product.variants.map((v) => (
                          <span
                            key={v.id}
                            title={v.name}
                            className="w-4 h-4 rounded-full border border-[#c9c2b8] shrink-0"
                            style={{backgroundColor: v.colorHex}}
                          />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                {specLabels.map((label) => (
                  <tr key={label} className="border-t border-[#c9c2b8]">
                    <td className="p-3 text-xs uppercase tracking-widest text-[#6d6560]">{label}</td>
                    {items.map((product) => {
                      const spec = product.specs.find((s) => s.label === label);
                      return (
                        <td key={product.id} className="p-3 text-[#241a16]">
                          {spec?.value ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t border-[#c9c2b8]">
                  <td className="p-3" />
                  {items.map((product) => (
                    <td key={product.id} className="p-3">
                      <button
                        type="button"
                        onClick={() => addItem(product)}
                        className="w-full py-2.5 rounded-lg bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-[11px] uppercase tracking-widest font-medium transition-colors cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
