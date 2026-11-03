export interface NavMenuItem {
  label: string;
  to: string;
  /** Circular tile photo in the mega-menu. Omit to show the monogram placeholder. */
  image?: string;
}

export interface NavMenu {
  label: string;
  /** Set for top-level entries with no children — rendered as a plain link. */
  to?: string;
  items: NavMenuItem[];
}

interface ShopifyMenuItem {
  title: string;
  url?: string | null;
  items?: {title: string; url?: string | null}[] | null;
}

const unsplash = (photo: string) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=600&h=600&q=70`;

/**
 * Stand-in mega-menu tile photos, keyed by collection handle. A collection
 * image set in Shopify Admin (Products → Collections → image) always wins
 * over these — see ShowcaseHeader. Stock photos are from Unsplash (free
 * under the Unsplash License); swap in real product photography over time.
 */
const CATEGORY_TILE_IMAGES: Record<string, string> = {
  'insulated-bottles': '/images/products/catalog/thermos-honey.jpg',
  'kids-bottles': '/images/products/new/character-bottle-panda.jpg',
  'kids-best-sellers': '/images/products/new/character-bottle-elephant.jpg',
  'coffee-tumblers': '/images/products/catalog/tumbler-noir.jpg',
  'tea-coffee-flasks': '/images/products/catalog/flask-butterfly.jpg',
  'cups-mugs': '/images/products/new/bamboo-lid-cup.jpg',
  'stainless-steel-bottles': unsplash('photo-1625708458528-802ec79b1ed8'),
  'sipper-bottles': unsplash('photo-1598443053960-0e8608b282fd'),
  'whiskey-glasses': unsplash('photo-1611603308770-cf1abd45c9de'),
  'wine-glasses': unsplash('photo-1634832296440-b5bac2df86c3'),
  'flute-glasses': unsplash('photo-1565461863445-bc2ae630fc53'),
  'mason-jars': unsplash('photo-1622428051717-dcd8412959de'),
  'beer-mugs': unsplash('photo-1658245798119-4fad546590ab'),
  'tall-glasses': unsplash('photo-1765380935261-241fb896d8f4'),
  'travel-pouches': unsplash('photo-1765516976457-550bd5f6f708'),
  'kids-aprons': unsplash('photo-1587973496572-b5c0f44c554d'),
  'kids-diaries': unsplash('photo-1601001435957-74f0958a93fb'),
  'kids-pencil-boxes': unsplash('photo-1568205612837-017257d2310a'),
  kitchenware: unsplash('photo-1466027575040-12134f1397fa'),
};

export function tileImageFor(to: string): string | undefined {
  const match = /^\/collections\/([^/?#]+)/.exec(to);
  return match ? CATEGORY_TILE_IMAGES[match[1]] : undefined;
}

// Home / Shop / About are fixed links in the header already.
const FIXED_PATHS = new Set(['/', '/collections/all', '/collections', '/about']);

function toPath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    return parsed.pathname + parsed.search;
  } catch {
    return null;
  }
}

/**
 * Turns Shopify's own navigation menu (Admin → Online Store → Navigation,
 * handle `main-menu`) into mega-menu data: a top-level item with children is
 * a category, its children are sub-categories. Returns [] when the menu has
 * no nested items so the caller can fall back to the bundled defaults.
 */
export function buildNavMenus(items: ShopifyMenuItem[] | null | undefined): NavMenu[] {
  const menus: NavMenu[] = [];
  for (const item of items ?? []) {
    const children = (item.items ?? [])
      .flatMap((child): NavMenuItem[] => {
        const to = toPath(child.url);
        return to ? [{label: child.title, to, image: tileImageFor(to)}] : [];
      });
    if (children.length > 0) {
      menus.push({label: item.title, items: children});
    } else {
      const to = toPath(item.url);
      if (to && !FIXED_PATHS.has(to.split('?')[0])) menus.push({label: item.title, to, items: []});
    }
  }
  return menus.sort((a, b) => a.label.localeCompare(b.label));
}

// Fallback used until the store's Shopify `main-menu` has nested items — the
// live nav is driven from Shopify Admin → Navigation. Each `to` must match a
// real Shopify collection handle.
export const DEFAULT_NAV_MENUS: NavMenu[] = ([
  {
    label: 'Drinkware',
    items: [
      { label: 'Insulated Bottles', to: '/collections/insulated-bottles', image: '/images/products/catalog/thermos-honey.jpg' },
      { label: 'Kids Bottles', to: '/collections/kids-bottles', image: '/images/products/new/character-bottle-elephant.jpg' },
      { label: 'Stainless Steel Bottle', to: '/collections/stainless-steel-bottles' },
      { label: 'Sipper Bottle', to: '/collections/sipper-bottles' },
      { label: 'Coffee Tumbler', to: '/collections/coffee-tumblers', image: '/images/products/catalog/tumbler-noir.jpg' },
      { label: 'Tea & Coffee Flasks', to: '/collections/tea-coffee-flasks', image: '/images/products/catalog/flask-butterfly.jpg' },
      { label: 'Cups / Mugs', to: '/collections/cups-mugs', image: '/images/products/new/bamboo-lid-cup.jpg' },
    ],
  },
  {
    label: 'Glassware',
    items: [
      { label: 'Whiskey Glasses', to: '/collections/whiskey-glasses' },
      { label: 'Wine Glasses', to: '/collections/wine-glasses' },
      { label: 'Flute Glasses', to: '/collections/flute-glasses' },
      { label: 'Mason Jars', to: '/collections/mason-jars' },
      { label: 'Beer Mugs', to: '/collections/beer-mugs' },
      { label: 'Tall Glasses', to: '/collections/tall-glasses' },
    ],
  },
  {
    label: 'Other',
    items: [
      { label: 'Travel Pouch', to: '/collections/travel-pouches' },
    ],
  },
  {
    label: 'Kids',
    items: [
      { label: 'Best Sellers', to: '/collections/kids-best-sellers' },
      { label: 'Bottles', to: '/collections/kids-bottles', image: '/images/products/new/character-bottle-panda.jpg' },
      { label: 'Tiffin', to: '/collections/kids-tiffin' },
      { label: 'Aprons', to: '/collections/kids-aprons' },
      { label: 'Name Plate', to: '/collections/kids-name-plates' },
      { label: 'Diaries', to: '/collections/kids-diaries' },
      { label: 'Pencil Boxes', to: '/collections/kids-pencil-boxes' },
    ],
  },
  { label: 'Kitchenware', to: '/collections/kitchenware', items: [] },
] as NavMenu[]).sort((a, b) => a.label.localeCompare(b.label)); // categories stay A–Z automatically

/**
 * The menu tree the header and the shop sidebar both render. A flat
 * `main-menu` (just Home / Contact / About) has no categories, so unless at
 * least one entry has children we keep the bundled category tree rather than
 * losing the dropdowns altogether.
 */
export function resolveNavMenus(items: ShopifyMenuItem[] | null | undefined): NavMenu[] {
  const built = buildNavMenus(items);
  const menus = built.some((menu) => menu.items.length > 0) ? built : DEFAULT_NAV_MENUS;
  return menus.map((menu) => ({
    ...menu,
    items: menu.items.map((item) => ({...item, image: item.image ?? tileImageFor(item.to)})),
  }));
}
