import { formatAmount } from '~/lib/money';
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  buildMeta,
  cleanBrandTypos,
  siteOrigin,
  stripHtml,
  truncate,
} from '~/lib/seo';
import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/products.$handle';
import { Analytics, Image } from '@shopify/hydrogen';
import { useShowcaseCart } from '~/context/ShowcaseCartContext';
import { useWishlist } from '~/context/WishlistContext';
import { useRecentlyViewed } from '~/context/RecentlyViewedContext';
import { useAddToCartFeedback } from '~/hooks/useAddToCartFeedback';
import { Breadcrumb } from '~/components/visual/Common/Breadcrumb';
import { LogoMark } from '~/components/visual/Common/Logo';
import { ShareRow } from '~/components/visual/Product/ShareRow';
import { NotifyWhenAvailable } from '~/components/visual/Product/NotifyWhenAvailable';
import { SizeGuideModal } from '~/components/visual/Product/SizeGuideModal';
import { RecentlyViewedRail } from '~/components/visual/Product/RecentlyViewedRail';
import { ProductModelViewer } from '~/components/visual/Product/ProductModelViewer';
import { SwatchButton } from '~/components/visual/Product/SwatchButton';
import type { ProductVariant } from '~/data/showcaseProducts';
import { cleanVariantId, triggerShiprocketCheckoutAsync } from '~/lib/shiprocket';
import {
  PRODUCT_BY_HANDLE_QUERY,
  RELATED_PRODUCTS_QUERY,
  mapProductNode,
  mapRelatedProducts,
  type ProductByHandleQueryResult,
  type RelatedProductsQueryResult,
} from '~/lib/showcaseCommerce';

export const meta: Route.MetaFunction = ({ data, matches }) => {
  const product = data?.product;
  if (!product) {
    return buildMeta({ matches, title: 'Product Not Found', noindex: true });
  }

  const origin = siteOrigin(matches);
  const path = `/products/${product.handle}`;
  const name = cleanBrandTypos(product.title);
  const inStock = product.variants.some((v) => v.inStock);
  const images = Array.from(
    new Set([product.image, ...product.variants.map((v) => v.image)].filter((i): i is string => Boolean(i))),
  )
    .slice(0, 8)
    .map((i) => absoluteUrl(origin, i));
  const description = data.seo?.description || product.description || product.tagline;

  return buildMeta({
    matches,
    path,
    title: data.seo?.title || name,
    exactTitle: Boolean(data.seo?.title),
    description,
    image: images[0],
    imageAlt: name,
    type: 'product',
    extra: [
      { property: 'product:price:amount', content: String(product.price) },
      { property: 'product:price:currency', content: product.currency },
      { property: 'product:availability', content: inStock ? 'in stock' : 'out of stock' },
      { property: 'product:brand', content: SITE_NAME },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description: truncate(stripHtml(product.description || product.tagline), 5000),
        image: images,
        sku: product.handle,
        brand: { '@type': 'Brand', name: SITE_NAME },
        category: product.category,
        offers: {
          '@type': 'Offer',
          url: absoluteUrl(origin, path),
          priceCurrency: product.currency,
          price: product.price.toFixed(2),
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: SITE_NAME },
          // Mirrors the FAQ: free delivery across India, dispatch within 24h,
          // 3–6 business days in transit, 7-day returns. Keep in sync with
          // app/routes/faq.tsx and the Refund Policy if those ever change.
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: product.currency },
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
              transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 6, unitCode: 'DAY' },
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'IN',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 7,
            returnMethod: 'https://schema.org/ReturnByMail',
          },
        },
      },
      breadcrumbJsonLd(origin, [
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/collections/all' },
        { name, path },
      ]),
    ],
  });
};

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const result = await storefront
    .query<ProductByHandleQueryResult>(PRODUCT_BY_HANDLE_QUERY, {
      variables: { handle },
      cache: storefront.CacheShort(),
    })
    .catch((error: Error) => {
      console.warn('Product query fallback:', error?.message);
      return null;
    });

  if (!result?.product) {
    throw new Response(null, { status: 404 });
  }

  const feeVariants = result.customizationFeeProduct?.variants.nodes ?? [];
  const product = mapProductNode(result.product, 0, feeVariants);

  // Scoped server-side to the same product type, instead of fetching the
  // whole catalog and filtering 4 out of it client-side — skipped entirely
  // for a product with no productType set (nothing sensible to match on).
  // `-handle:` isn't a supported field in Storefront search syntax (it's
  // silently ignored rather than erroring, so the current product would
  // otherwise show up in its own "related" list) — excluded client-side
  // instead, and one extra result is requested to still fill the full
  // count after that exclusion.
  let relatedProducts: ReturnType<typeof mapRelatedProducts> = [];
  if (result.product.productType) {
    const escapedType = result.product.productType.replace(/'/g, "\\'");
    const relatedResult = await storefront
      .query<RelatedProductsQueryResult>(RELATED_PRODUCTS_QUERY, {
        variables: {
          query: `product_type:'${escapedType}'`,
          first: 5,
        },
        cache: storefront.CacheShort(),
      })
      .catch((error: Error) => {
        console.warn('Related products query fallback:', error?.message);
        return null;
      });
    if (relatedResult) {
      relatedResult.products.nodes = relatedResult.products.nodes.filter((n) => n.handle !== handle);
    }
    relatedProducts = mapRelatedProducts(relatedResult, feeVariants).slice(0, 4);
  }

  return {
    product,
    relatedProducts,
    seo: result.product.seo ?? null,
    origin: new URL(request.url).origin,
  };
}

export default function Product() {
  const { product, relatedProducts, origin } = useLoaderData<typeof loader>();
  const { addItem, openDrawer } = useShowcaseCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { recordView } = useRecentlyViewed();

  const [activeVariant, setActiveVariant] = useState<ProductVariant>(
    () => product.variants.find((v) => v.id === product.defaultVariantId) || product.variants[0],
  );
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Variant-level only: a product-wide fallback would show the panda model on every other animal.
  const currentGlb = activeVariant.modelGlb;

  // React Router reuses this component instance across in-app navigations
  // between two product pages (same route pattern, different :handle) —
  // the lazy useState initializers above only run on the very first mount,
  // so without this, clicking a related/recently-viewed product kept
  // showing the PREVIOUS product's selected image/variant until a swatch
  // was clicked. Reset everything product-specific whenever the loader
  // hands us a different product.
  useEffect(() => {
    setActiveVariant(product.variants.find((v) => v.id === product.defaultVariantId) || product.variants[0]);
    setQuantity(1);
    setCustomName('');
    setViewMode('photo');
  }, [product.id]);

  useEffect(() => {
    if (!currentGlb) setViewMode('photo');
  }, [currentGlb]);

  const { state: addState, trigger: handleAddToCart } = useAddToCartFeedback(
    () => addItem(product, activeVariant.id, quantity, customName.trim() || undefined),
    { addedDurationMs: 2200 },
  );

  const handleBuyNow = async () => {
    const numericId = cleanVariantId(activeVariant.id);
    const fastrrProducts = [{ variantId: numericId, quantity }];
    if (customName.trim() && product.customization?.enabled && product.customization.feeVariantId) {
      fastrrProducts.push({
        variantId: cleanVariantId(product.customization.feeVariantId),
        quantity,
      });
    }

    const cartAttributes: Record<string, string> = {};
    if (customName.trim()) {
      cartAttributes['Customization'] = `${product.title}: ${customName.trim()}`;
    }

    const launchedFastrr = await triggerShiprocketCheckoutAsync({
      type: 'product',
      products: fastrrProducts,
      ...(Object.keys(cartAttributes).length > 0 ? { cartAttributes } : {}),
    });

    if (!launchedFastrr) {
      addItem(product, activeVariant.id, quantity, customName.trim() || undefined);
      openDrawer();
    }
  };
  const isAdded = addState === 'added';
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;
  const isSaved = isWishlisted(product.id);
  const capacitySpec = product.specs.find((s) => s.label.toLowerCase() === 'capacity')?.value;

  // Records this page as viewed once per mount — not on every variant swap,
  // which would otherwise churn the rail as someone just clicks finishes.
  useEffect(() => {
    recordView(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return (
    <div className="urbanessentials-showcase bg-white text-[#241a16] font-sans">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: product.title },
        ]}
        className="max-w-6xl mx-auto px-6 md:px-12 pt-28"
      />
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-6 pb-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        {/* Media / 3D Viewer */}
        <div className="flex flex-col gap-3.5">
          <div
            onClick={() => {
              if (viewMode === 'photo' && (activeVariant.image || product.image)) {
                setLightboxOpen(true);
              }
            }}
            className={`relative aspect-square rounded-3xl overflow-hidden bg-[#f8f5ee] shadow-sm flex items-center justify-center p-3 sm:p-5 ${
              viewMode === 'photo' && (activeVariant.image || product.image) ? 'cursor-zoom-in' : ''
            }`}
          >
            {viewMode === '3d' && currentGlb ? (
              <ProductModelViewer
                src={currentGlb}
                poster={activeVariant.image || product.image}
                alt={`${product.title} 3D Model`}
              />
            ) : activeVariant.image || product.image ? (
              <Image
                src={activeVariant.image || product.image}
                alt={`${product.title} — ${activeVariant.name}`}
                sizes="(min-width: 768px) 50vw, 100vw"
                loading="eager"
                className="w-full h-full object-contain object-center drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <LogoMark className="w-16 h-20 text-[#241a16]/15" />
              </div>
            )}

            {/* Click to enlarge hint on hover */}
            {viewMode === 'photo' && (activeVariant.image || product.image) && (
              <div className="absolute bottom-4 right-4 bg-[#241a16]/80 text-white p-2 rounded-full backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7.5 7.5 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            )}

            <div className="absolute top-5 left-5 flex flex-col items-start gap-1.5 z-10">
              {hasDiscount && (
                <span className="px-3 py-1 rounded-full bg-[#b5402f] text-white text-[10px] uppercase tracking-widest font-semibold">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={isSaved ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
              aria-pressed={isSaved}
              className={`absolute top-5 right-5 z-10 w-10 h-10 rounded-full backdrop-blur-md border shadow-sm flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isSaved ? 'bg-[#b5402f] border-[#b5402f]' : 'bg-white/90 hover:bg-white border-[#c9c2b8]'
              }`}
            >
              <svg
                className={`w-[18px] h-[18px] ${isSaved ? 'text-white' : 'text-[#241a16]'}`}
                fill={isSaved ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {/* View mode switcher & interactive thumbnails */}
          {currentGlb && (
            <div className="flex flex-col items-center pt-1">
              {/* Media Thumbnails */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('photo')}
                  aria-label="View product photo"
                  className={`relative w-16 h-16 rounded-2xl overflow-hidden bg-[#e8e1d4] border-2 transition-all cursor-pointer ${
                    viewMode === 'photo'
                      ? 'border-[#241a16] scale-105 shadow-md ring-2 ring-[#b89b6a]/40'
                      : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {activeVariant.image || product.image ? (
                    <img
                      src={activeVariant.image || product.image}
                      alt={activeVariant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <span className="absolute bottom-1 right-1 bg-[#241a16]/80 text-[9px] text-white px-1 rounded font-medium">
                    2D
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  aria-label="View interactive 3D model"
                  className={`relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#f2eee6] to-[#e8e1d4] border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    viewMode === '3d'
                      ? 'border-[#b89b6a] scale-105 shadow-md ring-2 ring-[#b89b6a]/40 bg-[#f8f5ee]'
                      : 'border-[#c9c2b8] opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <svg className="w-5 h-5 text-[#b89b6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  <span className="text-[9px] font-bold text-[#241a16] tracking-wider uppercase">
                    3D • AR
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center space-y-5">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            {product.tagline}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] leading-tight">
            {product.title}
          </h1>

          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-serif font-bold text-[#241a16]">
              {product.currencySymbol}
              {formatAmount(product.price, product.currencySymbol)}
            </span>
            {hasDiscount && (
              <span className="text-xl font-serif font-medium text-[#a69686] line-through">
                {product.currencySymbol}
                {formatAmount((product.originalPrice as number), product.currencySymbol)}
              </span>
            )}
            <span
              className={`text-[11px] uppercase tracking-widest font-semibold ${
                product.availability === 'In Stock' ? 'text-emerald-700' : 'text-[#6d6560]'
              }`}
            >
              {product.availability}
            </span>
          </div>

          <p className="text-sm text-[#6d6560] leading-relaxed max-w-md">{product.description}</p>

          {product.details.length > 0 && (
            <ul className="space-y-1.5 text-xs text-[#3a2c24]">
              {product.details.map((detail) => (
                <li key={detail} className="flex items-start space-x-2">
                  <span className="w-1 h-1 rounded-full bg-[#b89b6a] mt-1.5 shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}

          {product.variants.length > 1 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs uppercase tracking-widest text-[#6d6560]">
                Finish: <span className="text-[#241a16] font-semibold">{activeVariant.name}</span>
              </span>
              <div className="flex items-center flex-wrap gap-1 -ml-1.5">
                {product.variants.map((v) => (
                  <SwatchButton
                    key={v.id}
                    color={v.colorHex}
                    selected={activeVariant.id === v.id}
                    disabled={!v.inStock}
                    title={`${v.name}${v.inStock ? '' : ' (Out of stock)'}`}
                    onClick={() => setActiveVariant(v)}
                    size={26}
                  />
                ))}
              </div>
            </div>
          )}

          {product.customization?.enabled && (
            <div className="space-y-1.5 pt-2">
              <label
                htmlFor="pdp-custom-name"
                className="text-xs uppercase tracking-widest text-[#6d6560] flex items-center justify-between"
              >
                <span>Customize with a name</span>
                <span className="text-xs text-[#6d6560] normal-case font-serif font-semibold">
                  +{product.currencySymbol}
                  {formatAmount(product.customization.feeAmount, product.currencySymbol)}
                </span>
              </label>
              <input
                id="pdp-custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Priya"
                maxLength={40}
                className="w-full max-w-sm text-sm bg-white border border-[#c9c2b8] rounded-lg px-3 py-2.5 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition"
              />
            </div>
          )}

          {activeVariant.inStock ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex items-center justify-between sm:justify-start border border-[#c9c2b8] rounded-xl overflow-hidden bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-3 text-[#6d6560] hover:text-[#241a16] hover:bg-[#f4f0e8] text-sm transition cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-4 py-3 text-base font-serif font-bold text-[#241a16]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-3 text-[#6d6560] hover:text-[#241a16] hover:bg-[#f4f0e8] text-sm transition cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addState !== 'idle'}
                className={`flex-1 py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white hover:bg-[#f4f0e8] text-[#241a16] border border-[#241a16]'
                }`}
              >
                {isAdded ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Added</span>
                  </>
                ) : (
                  <span>Add to Cart</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3.5 px-5 rounded-xl text-xs uppercase tracking-widest font-semibold bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] transition-all duration-300 shadow-md flex items-center justify-center space-x-2 cursor-pointer group"
              >
                <svg
                  className="w-3.5 h-3.5 text-[#b89b6a] group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Buy Now</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 space-y-2">
              <span className="text-[11px] uppercase tracking-widest text-[#b5402f] font-semibold">
                Out of Stock — {activeVariant.name}
              </span>
              <NotifyWhenAvailable productLabel={`${product.title} — ${activeVariant.name}`} />
            </div>
          )}

          {product.specs.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-6 border-t border-[#c9c2b8] text-xs">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-3">
                  <dt className="text-[#6d6560] shrink-0">{spec.label}</dt>
                  <dd className="text-[#241a16] font-medium text-right">{spec.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="text-[11px] uppercase tracking-widest text-[#6d6560] hover:text-[#241a16] underline underline-offset-2 transition-colors cursor-pointer self-start"
          >
            Not sure which capacity? See the guide
          </button>

          <p className="text-[11px] uppercase tracking-wider text-[#6d6560] font-medium pt-2">
            {product.shipsIn}
            {product.giftNoteIncluded ? ' · Complimentary Gift Note' : ''}
            {product.customization?.enabled && product.customization.shippingDays > 0
              ? ` · +${product.customization.shippingDays} Days if Customized`
              : ''}
          </p>

          <ShareRow title={product.title} url={`${origin}/products/${product.handle}`} />
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 md:px-12 pb-24 border-t border-[#c9c2b8] pt-16">
          <div className="mb-8">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
              Complete the Set
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-light text-[#241a16] mt-2">
              You Might Also Like
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((related) => (
              <Link
                key={related.id}
                to={`/products/${related.handle}`}
                prefetch="intent"
                className="group flex flex-col rounded-2xl bg-white border border-[#c9c2b8] hover:border-[#b89b6a] overflow-hidden transition-colors"
              >
                <div className="aspect-square overflow-hidden bg-[#e8e1d4]">
                  {related.image ? (
                    <Image
                      src={related.image}
                      alt={related.title}
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
                  <p className="text-sm font-medium text-[#241a16] tracking-tight truncate">
                    {related.title}
                  </p>
                  <p className="text-base font-serif font-bold text-[#241a16] mt-0.5">
                    {related.currencySymbol}
                    {formatAmount(related.price, related.currencySymbol)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <RecentlyViewedRail excludeId={product.id} />

      {isSizeGuideOpen && (
        <SizeGuideModal capacity={capacitySpec} onClose={() => setIsSizeGuideOpen(false)} />
      )}

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: String(product.price),
              vendor: 'UrbanEssentials',
              variantId: activeVariant.id,
              variantTitle: activeVariant.name,
              quantity,
            },
          ],
        }}
      />


      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-[fadeIn_200ms_ease-out]"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close enlarged view"
            className="absolute top-5 right-5 sm:top-8 sm:right-8 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2.5 transition-colors cursor-pointer z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeVariant.image || product.image}
              alt={`${product.title} — ${activeVariant.name}`}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
