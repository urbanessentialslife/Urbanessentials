/**
 * Bridges the showcase's hand-designed marketing copy (SHOWCASE_PRODUCTS —
 * taglines, spec sheets, curated cutout/video assets per finish) with real,
 * live Shopify product data (price, stock, and the real product/variant IDs
 * a cart mutation needs).
 *
 * For the 4 products the showcase was designed around, real Shopify data is
 * merged onto the curated template by matching variant name (e.g. "Stone
 * Cream"), so admin-edited price/stock changes go live immediately while the
 * bespoke visuals stay put. Any other product the admin creates in Shopify
 * still renders — through a generic mapper with sensible defaults — so the
 * catalog grid always reflects the real store, not just these 4.
 */
import { currencySymbolFor } from '~/lib/money';
import {
  SHOWCASE_PRODUCTS,
  type ShowcaseProduct,
  type ProductVariant,
  type ProductCustomization,
} from '~/data/showcaseProducts';

export const SHOWCASE_CATALOG_QUERY = `#graphql
  query ShowcaseCatalog($first: Int!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        descriptionHtml
        tags
        productType
        collections(first: 20) {
          nodes {
            handle
          }
        }
        featuredImage {
          url
          altText
        }
        options {
          name
          values
        }
        variants(first: 20) {
          nodes {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            modelFile: metafield(namespace: "custom", key: "model_glb") {
              reference {
                ... on GenericFile { url }
                ... on Model3d { sources { url mimeType } }
              }
            }
            image {
              url
              altText
            }
          }
        }
        metafields(identifiers: [
          {namespace: "custom", key: "enable_customization"}
          {namespace: "custom", key: "customization_fee"}
          {namespace: "custom", key: "customization_shipping_days"}
        ]) {
          key
          value
        }
      }
    }
    # Handle of the store's "Customization Fee" product — see
    # docs/customization-setup.md. Hardcoded rather than interpolated: this
    # query is statically parsed by Hydrogen's codegen, which can't
    # evaluate JS template expressions inside a #graphql-tagged string.
    customizationFeeProduct: product(handle: "customization-fee") {
      variants(first: 50) {
        nodes {
          id
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

// Same field selection as SHOWCASE_CATALOG_QUERY, sorted by Shopify's own
// BEST_SELLING order instead of title — powers the homepage's Top Sellers
// section. A brand-new store has no sales history yet, so Shopify falls
// back to its default manual/featured order until real orders accumulate;
// nothing special to handle on this end for that.
export const TOP_SELLERS_QUERY = `#graphql
  query TopSellers($first: Int!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        id
        handle
        title
        descriptionHtml
        tags
        productType
        featuredImage {
          url
          altText
        }
        options {
          name
          values
        }
        variants(first: 20) {
          nodes {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            modelFile: metafield(namespace: "custom", key: "model_glb") {
              reference {
                ... on GenericFile { url }
                ... on Model3d { sources { url mimeType } }
              }
            }
            image {
              url
              altText
            }
          }
        }
        metafields(identifiers: [
          {namespace: "custom", key: "enable_customization"}
          {namespace: "custom", key: "customization_fee"}
          {namespace: "custom", key: "customization_shipping_days"}
        ]) {
          key
          value
        }
      }
    }
    customizationFeeProduct: product(handle: "customization-fee") {
      variants(first: 50) {
        nodes {
          id
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

// A single product by handle, instead of fetching the entire catalog just
// to find one — the PDP used to pull all 50 products' full variant +
// metafield data on every view, which only gets heavier as the catalog
// grows. This is the one query a product page actually needs.
export const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query ProductByHandle($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      descriptionHtml
      tags
      productType
      featuredImage {
        url
        altText
      }
      options {
        name
        values
      }
      variants(first: 20) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          modelFile: metafield(namespace: "custom", key: "model_glb") {
            reference {
              ... on GenericFile { url }
              ... on Model3d { sources { url mimeType } }
            }
          }
          image {
            url
            altText
          }
        }
      }
      metafields(identifiers: [
        {namespace: "custom", key: "enable_customization"}
        {namespace: "custom", key: "customization_fee"}
        {namespace: "custom", key: "customization_shipping_days"}
      ]) {
        key
        value
      }
    }
    customizationFeeProduct: product(handle: "customization-fee") {
      variants(first: 50) {
        nodes {
          id
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

export interface ProductByHandleQueryResult {
  product: ShopifyProductNode | null;
  customizationFeeProduct: ShowcaseCatalogQueryResult['customizationFeeProduct'];
}

// A handful of same-productType products for "You Might Also Like" —
// scoped server-side by Shopify's own search syntax, rather than fetching
// every product in the store and filtering client-side for 4 of them.
export const RELATED_PRODUCTS_QUERY = `#graphql
  query RelatedProducts($query: String!, $first: Int!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: $first, query: $query) {
      nodes {
        id
        handle
        title
        descriptionHtml
        tags
        productType
        featuredImage {
          url
          altText
        }
        options {
          name
          values
        }
        variants(first: 20) {
          nodes {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            modelFile: metafield(namespace: "custom", key: "model_glb") {
              reference {
                ... on GenericFile { url }
                ... on Model3d { sources { url mimeType } }
              }
            }
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
` as const;

export interface RelatedProductsQueryResult {
  products: { nodes: ShopifyProductNode[] };
}

export const PRODUCTS_BY_ID_QUERY = `#graphql
  query ProductsById($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        id
        handle
        title
        descriptionHtml
        tags
        productType
        featuredImage {
          url
          altText
        }
        options {
          name
          values
        }
        variants(first: 20) {
          nodes {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            modelFile: metafield(namespace: "custom", key: "model_glb") {
              reference {
                ... on GenericFile { url }
                ... on Model3d { sources { url mimeType } }
              }
            }
            image {
              url
              altText
            }
          }
        }
        metafields(identifiers: [
          {namespace: "custom", key: "enable_customization"}
          {namespace: "custom", key: "customization_fee"}
          {namespace: "custom", key: "customization_shipping_days"}
        ]) {
          key
          value
        }
      }
    }
    # See the matching comment on SHOWCASE_CATALOG_QUERY above — hardcoded
    # for the same static-codegen reason.
    customizationFeeProduct: product(handle: "customization-fee") {
      variants(first: 50) {
        nodes {
          id
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

export interface ProductsByIdQueryResult {
  nodes: (ShopifyProductNode | null)[];
  customizationFeeProduct: ShowcaseCatalogQueryResult['customizationFeeProduct'];
}

interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

interface ShopifyVariantNode {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: { name: string; value: string }[];
  image: { url: string; altText: string | null } | null;
  /** Admin-uploaded 3D model: variant metafield `custom.model_glb` (File type). */
  modelFile?: {
    reference?: { url?: string; sources?: { url: string; mimeType: string }[] } | null;
  } | null;
}

/** URL of the .glb an admin uploaded for this variant in Shopify Admin, if any. */
function variantGlbUrl(variant: ShopifyVariantNode): string | undefined {
  const ref = variant.modelFile?.reference;
  if (!ref) return undefined;
  if (ref.url) return ref.url;
  const glb = ref.sources?.find((src) => src.mimeType === 'model/gltf-binary') ?? ref.sources?.[0];
  return glb?.url;
}

interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  tags: string[];
  productType: string;
  featuredImage: { url: string; altText: string | null } | null;
  options: { name: string; values: string[] }[];
  variants: { nodes: ShopifyVariantNode[] };
  // Optional — collections.$handle.tsx's COLLECTION_QUERY doesn't request
  // this (see the fix in resolveCustomization above), so this shape is
  // reused for two slightly different queries rather than exactly one.
  metafields?: ({ key: string; value: string } | null)[];
  /** Only requested by the shop-all query (powers the category filter). */
  collections?: { nodes: { handle: string }[] };
}

export interface ShowcaseCatalogQueryResult {
  products: { nodes: ShopifyProductNode[] };
  customizationFeeProduct: {
    variants: { nodes: { id: string; price: ShopifyMoney }[] };
  } | null;
}


const FALLBACK_PALETTE = ['#c9c2b8', '#a69686', '#8c7456', '#6d6560', '#4a3f37'];

const LOCAL_BY_HANDLE = new Map<string, ShowcaseProduct>(
  SHOWCASE_PRODUCTS.map((product) => [product.handle, product]),
);

function categoryFromShopify(product: ShopifyProductNode): ShowcaseProduct['category'] {
  const title = (product.title || '').toLowerCase();
  const type = (product.productType || '').toLowerCase();
  const tags = (product.tags || []).map((t) => t.toLowerCase()).join(' ');
  const combined = `${title} ${type} ${tags}`;

  // Curated Sets & Tableware (Sets, Trios, Pairs, Jars, Lamps, Gifts, Saucers)
  if (
    combined.includes('set') ||
    combined.includes('pair') ||
    combined.includes('trio') ||
    combined.includes('jar') ||
    combined.includes('lamp') ||
    combined.includes('saucer') ||
    combined.includes('gift')
  ) {
    return 'gift-set';
  }

  // Tumblers
  if (combined.includes('tumbler')) {
    return 'tumbler';
  }

  // Mugs & Cups
  if (combined.includes('mug') || combined.includes('cup') || combined.includes('carafe')) {
    return 'mug';
  }

  // Water bottles
  if (combined.includes('bottle')) {
    return 'bottle';
  }

  return 'lifestyle';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Reads the three `custom.*` metafields (see docs/customization-setup.md)
 * and, if customization is enabled, resolves the fee amount to a real
 * variant on the "Customization Fee" product by matching price — that
 * variant is what actually gets added as a real, billable cart line at
 * checkout (see ShowcaseCartContext.checkout).
 */
function resolveCustomization(
  shopifyProduct: ShopifyProductNode,
  feeVariants: { id: string; price: ShopifyMoney }[],
  fallbackCurrencyCode: string,
): ProductCustomization | undefined {
  const byKey = new Map(
    (shopifyProduct.metafields ?? [])
      .filter((m) => m !== null)
      .map((m) => [m!.key, m!.value]),
  );

  const enabled = byKey.get('enable_customization') === 'true';
  if (!enabled) return undefined;

  const feeAmount = parseFloat(byKey.get('customization_fee') ?? '0') || 0;
  const shippingDays = parseInt(byKey.get('customization_shipping_days') ?? '0', 10) || 0;

  // Nearest-price match rather than exact equality — admin-entered fee
  // amounts and variant prices are both decimals, prone to float noise.
  let feeVariantId: string | null = null;
  let closestDiff = Infinity;
  for (const variant of feeVariants) {
    const diff = Math.abs(parseFloat(variant.price.amount) - feeAmount);
    if (diff < closestDiff) {
      closestDiff = diff;
      feeVariantId = variant.id;
    }
  }

  return {
    enabled: true,
    feeAmount,
    feeCurrencyCode: feeVariants[0]?.price.currencyCode ?? fallbackCurrencyCode,
    shippingDays,
    feeVariantId,
  };
}

/** Merges live Shopify data onto the curated local template for a known product. */
function mergeWithLocalTemplate(
  shopifyProduct: ShopifyProductNode,
  template: ShowcaseProduct,
  feeVariants: { id: string; price: ShopifyMoney }[],
): ShowcaseProduct {
  const variants: ProductVariant[] = shopifyProduct.variants.nodes.map((sv) => {
    const finishValue = sv.selectedOptions.find((o) => o.name === 'Finish')?.value ?? sv.title;
    const localVariant = template.variants.find(
      (lv) => lv.name.toLowerCase() === finishValue.toLowerCase(),
    );

    return {
      id: sv.id,
      name: finishValue,
      colorName: localVariant?.colorName ?? finishValue,
      colorHex: localVariant?.colorHex ?? FALLBACK_PALETTE[0],
      accentHex: localVariant?.accentHex ?? FALLBACK_PALETTE[1],
      finish: localVariant?.finish ?? 'Signature Finish',
      inStock: sv.availableForSale,
      image: localVariant?.image ?? sv.image?.url ?? shopifyProduct.featuredImage?.url,
      cutoutImage: localVariant?.cutoutImage,
      video: localVariant?.video,
      modelGlb: variantGlbUrl(sv) ?? localVariant?.modelGlb,
    };
  });

  const firstAvailable = variants.find((v) => v.inStock) ?? variants[0];
  const prices = shopifyProduct.variants.nodes.map((v) => parseFloat(v.price.amount));
  const compareAtPrices = shopifyProduct.variants.nodes
    .map((v) => (v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : null))
    .filter((v): v is number => v !== null);
  const currencyCode = shopifyProduct.variants.nodes[0]?.price.currencyCode ?? 'INR';

  return {
    ...template,
    id: shopifyProduct.id,
    variants,
    defaultVariantId: firstAvailable?.id ?? template.defaultVariantId,
    price: prices.length ? Math.min(...prices) : template.price,
    originalPrice: compareAtPrices.length ? Math.max(...compareAtPrices) : template.originalPrice,
    currency: currencyCode,
    currencySymbol: currencySymbolFor(currencyCode),
    availability: variants.some((v) => v.inStock) ? 'In Stock' : 'Pre-Order',
    image: template.image || shopifyProduct.featuredImage?.url || '',
    modelGlb: template.modelGlb,
    customization: resolveCustomization(shopifyProduct, feeVariants, currencyCode),
    category: categoryFromShopify(shopifyProduct) || template.category,
    tags: shopifyProduct.tags,
  };
}

/** Generic mapper for a product the admin created that isn't one of the curated 4. */
function mapGenericProduct(
  shopifyProduct: ShopifyProductNode,
  index: number,
  feeVariants: { id: string; price: ShopifyMoney }[],
): ShowcaseProduct {
  const optionName = shopifyProduct.options.find((o) => o.name !== 'Title')?.name;
  const variants: ProductVariant[] = shopifyProduct.variants.nodes.map((sv, i) => {
    const value = optionName
      ? sv.selectedOptions.find((o) => o.name === optionName)?.value ?? sv.title
      : sv.title;
    const swatch = FALLBACK_PALETTE[i % FALLBACK_PALETTE.length];
    return {
      id: sv.id,
      name: value,
      colorName: value,
      colorHex: swatch,
      accentHex: swatch,
      finish: 'Signature Finish',
      inStock: sv.availableForSale,
      image: sv.image?.url ?? shopifyProduct.featuredImage?.url,
      modelGlb: variantGlbUrl(sv),
    };
  });

  const firstAvailable = variants.find((v) => v.inStock) ?? variants[0];
  const prices = shopifyProduct.variants.nodes.map((v) => parseFloat(v.price.amount));
  const compareAtPrices = shopifyProduct.variants.nodes
    .map((v) => (v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : null))
    .filter((v): v is number => v !== null);
  const currencyCode = shopifyProduct.variants.nodes[0]?.price.currencyCode ?? 'INR';
  const description = stripHtml(shopifyProduct.descriptionHtml);

  return {
    id: shopifyProduct.id,
    handle: shopifyProduct.handle,
    title: shopifyProduct.title,
    tagline: description.slice(0, 90),
    description,
    details: [],
    specs: [],
    price: prices.length ? Math.min(...prices) : 0,
    originalPrice: compareAtPrices.length ? Math.max(...compareAtPrices) : undefined,
    currency: currencyCode,
    currencySymbol: currencySymbolFor(currencyCode),
    category: categoryFromShopify(shopifyProduct),
    variants,
    defaultVariantId: firstAvailable?.id ?? variants[0]?.id ?? '',
    // Empty, not a FALLBACK_PALETTE hex — this field is always rendered as an
    // <img src>, and a bare hex string there is a broken image, not a color
    // swatch (FALLBACK_PALETTE is for colorHex/accentHex, a few lines up).
    image: shopifyProduct.featuredImage?.url ?? '',
    availability: variants.some((v) => v.inStock) ? 'In Stock' : 'Pre-Order',
    shipsIn: 'Dispatches within 24 Hours',
    giftNoteIncluded: true,
    customization: resolveCustomization(shopifyProduct, feeVariants, currencyCode),
    tags: shopifyProduct.tags,
  };
}

// The "Customization Fee" product (see docs/customization-setup.md) is a
// real Shopify product — it has to be, so it can carry real priced variants
// — but it's an internal billing SKU only, auto-added as a second cart line
// by ShowcaseCartContext.checkout. It must never appear as a shoppable tile
// in the catalog grid, collections, search, or sitemap.
export const INTERNAL_PRODUCT_HANDLES = new Set(['customization-fee']);

/** Maps one live Shopify product node, merging curated assets when this handle is one of the 4. */
export function mapProductNode(
  node: ShopifyProductNode,
  index: number,
  feeVariants: { id: string; price: ShopifyMoney }[],
): ShowcaseProduct {
  const template = LOCAL_BY_HANDLE.get(node.handle);
  const mapped = template
    ? mergeWithLocalTemplate(node, template, feeVariants)
    : mapGenericProduct(node, index, feeVariants);
  return node.collections ? { ...mapped, collectionHandles: node.collections.nodes.map((c) => c.handle) } : mapped;
}

/** Maps the live Shopify catalog into ShowcaseProduct[], merging curated assets where known. */
export function mapShowcaseCatalog(result: ShowcaseCatalogQueryResult | null): ShowcaseProduct[] {
  if (!result?.products?.nodes?.length) {
    return SHOWCASE_PRODUCTS;
  }

  const feeVariants = result.customizationFeeProduct?.variants.nodes ?? [];

  return result.products.nodes
    .filter((node) => !INTERNAL_PRODUCT_HANDLES.has(node.handle))
    .map((node, index) => mapProductNode(node, index, feeVariants));
}

/**
 * Maps a `PRODUCTS_BY_ID_QUERY` result (arbitrary product GIDs, e.g. from a
 * past order's line items) into a lookup by product GID — used by the
 * account order pages to power "Order it again" with current price/stock,
 * not a snapshot from when the order was placed.
 */
export function mapProductsByIds(
  result: ProductsByIdQueryResult | null,
): Map<string, ShowcaseProduct> {
  const map = new Map<string, ShowcaseProduct>();
  if (!result?.nodes?.length) return map;

  const feeVariants = result.customizationFeeProduct?.variants.nodes ?? [];

  result.nodes.forEach((node, index) => {
    if (!node || INTERNAL_PRODUCT_HANDLES.has(node.handle)) return;
    map.set(node.id, mapProductNode(node, index, feeVariants));
  });

  return map;
}

/** Maps a RELATED_PRODUCTS_QUERY result, reusing the handle's own customization-fee variants. */
export function mapRelatedProducts(
  result: RelatedProductsQueryResult | null,
  feeVariants: { id: string; price: ShopifyMoney }[],
): ShowcaseProduct[] {
  if (!result?.products?.nodes?.length) return [];
  return result.products.nodes
    .filter((node) => !INTERNAL_PRODUCT_HANDLES.has(node.handle))
    .map((node, index) => mapProductNode(node, index, feeVariants));
}

/** Finds one product by handle from an already-mapped catalog (e.g. the hero "Coffee Cup"). */
export function findByHandle(
  catalog: ShowcaseProduct[],
  handle: string,
): ShowcaseProduct | undefined {
  return catalog.find((p) => p.handle === handle);
}
