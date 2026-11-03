/**
 * SHOWCASE DUMMY DATA — UrbanEssentials
 *
 * IMPORTANT:
 * This file contains strictly typed demonstration data for client showcase purposes.
 * DO NOT connect this file to Shopify Storefront API.
 * This is designed to be replaced or adapted by the commerce layer in future phases.
 */

export interface ProductVariant {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  accentHex: string;
  finish: string;
  inStock: boolean;
  image?: string;
  /** True alpha-transparent cutout — for floating the product over a scene rather than a card. */
  cutoutImage?: string;
  /** Looping cinematic clip for this variant, used by the hero spotlight. */
  video?: string;
  /** 3D model file (.glb) path for this specific variant */
  modelGlb?: string;
}

/**
 * Personalization set by the admin via product metafields (namespace
 * `custom`) — see docs/customization-setup.md for the exact Admin setup.
 * `feeVariantId` is resolved at catalog-fetch time by matching `feeAmount`
 * against the real "Customization Fee" product's variants, so it can be
 * added as a real, correctly-priced cart line at checkout.
 */
export interface ProductCustomization {
  enabled: boolean;
  feeAmount: number;
  feeCurrencyCode: string;
  shippingDays: number;
  feeVariantId: string | null;
}

export interface ShowcaseProduct {
  id: string;
  handle: string;
  title: string;
  /** Handles of the Shopify collections this product belongs to (shop-all only). */
  collectionHandles?: string[];
  tagline: string;
  description: string;
  details: string[];
  specs: { label: string; value: string }[];
  price: number;
  originalPrice?: number;
  currency: string;
  currencySymbol: string;
  category: 'tumbler' | 'gift-set' | 'lifestyle' | 'bottle' | 'mug';
  variants: ProductVariant[];
  defaultVariantId: string;
  badge?: string;
  image: string;
  /** 3D model file (.glb) fallback for the overall product */
  modelGlb?: string;
  availability: 'In Stock' | 'Low Stock' | 'Pre-Order';
  shipsIn: string;

  giftNoteIncluded: boolean;
  customization?: ProductCustomization;
  /** Raw Shopify product tags — e.g. an admin-set "featured" tag used to pin a product to the homepage Top Sellers rail before real sales history exists. */
  tags?: string[];
}

// ── The Coffee Cup (Signature Hero) ─────────────────────────────────────
export const COFFEE_CUP_VARIANTS: ProductVariant[] = [
  {
    id: 'var-coffeecup-stone-cream',
    name: 'Stone Cream',
    colorName: 'Stone Cream, Gold Accent',
    colorHex: '#e8dfc9',
    accentHex: '#b8935a',
    finish: 'Matte Ceramic-Coat Steel',
    inStock: true,
    image: '/images/products/hero/coffee-cup-stone-cream.png',
    cutoutImage: '/images/products/hero/coffee-cup-stone-cream-cutout.webp',
    video: '/videos/products/coffee-cup-01.mp4',
  },
  {
    id: 'var-coffeecup-sage-coral',
    name: 'Sage & Coral',
    colorName: 'Sage Green, Coral Band',
    colorHex: '#9db98f',
    accentHex: '#e0836f',
    finish: 'Matte Ceramic-Coat Steel',
    inStock: true,
    image: '/images/products/hero/coffee-cup-sage-coral.png',
    cutoutImage: '/images/products/hero/coffee-cup-sage-coral-cutout.webp',
    video: '/videos/products/coffee-cup-02.mp4',
  },
  {
    id: 'var-coffeecup-midnight-forest',
    name: 'Midnight Forest',
    colorName: 'Black to Forest Ombre',
    colorHex: '#232a22',
    accentHex: '#5c8a5a',
    finish: 'Matte Ceramic-Coat Steel',
    inStock: true,
    image: '/images/products/hero/coffee-cup-midnight-forest.png',
    cutoutImage: '/images/products/hero/coffee-cup-midnight-forest-cutout.webp',
    video: '/videos/products/coffee-cup-03.mp4',
  },
];

export const HERO_TUMBLERS: ShowcaseProduct[] = [
  {
    id: 'ue-coffee-cup',
    handle: 'the-coffee-cup',
    title: 'The Coffee Cup',
    tagline: '1.4L Vacuum Insulated Carry Mug, Locking Lid',
    description:
      'A sculpted everyday carry mug with a locking flip-top lid and a brushed gold accent latch. The ribbed body sits secure in hand and in a car cup holder, and the soft-touch band keeps a grip even when the shell runs cold.',
    details: [
      'Double-wall 18/8 stainless steel vacuum insulation',
      'Keeps drinks cold up to 24 hours, hot up to 12 hours',
      'Locking flip-top lid with brushed gold latch',
      'Ribbed grip body, sculpted side handle',
      'Fits standard car cup holders',
    ],
    specs: [
      { label: 'Capacity', value: '1400 ml / 47 oz' },
      { label: 'Material', value: '18/8 Stainless Steel' },
      { label: 'Lid', value: 'Locking Flip-Top' },
      { label: 'Finish', value: 'Matte Ceramic Coat' },
    ],
    price: 1349,
    originalPrice: 1749,
    currency: 'INR',
    currencySymbol: '₹',
    category: 'tumbler',
    variants: COFFEE_CUP_VARIANTS,
    defaultVariantId: 'var-coffeecup-stone-cream',
    badge: 'Signature Hero',
    image: '/images/products/hero/coffee-cup-stone-cream.png',
    availability: 'In Stock',
    shipsIn: 'Dispatches within 24 Hours',
    giftNoteIncluded: true,
  },
];

// ── Heritage Enamel Vacuum Flask ────────────────────────────────────────
export const FLASK_VARIANTS: ProductVariant[] = [
  {
    id: 'var-flask-butterfly',
    name: 'Golden Butterfly',
    colorName: 'Amber Gold, Butterfly Motif',
    colorHex: '#c99a3f',
    accentHex: '#7a2a2f',
    finish: 'Hand-Finished Enamel',
    inStock: true,
    image: '/images/products/catalog/flask-butterfly.jpg',
  },
  {
    id: 'var-flask-peacock-jade',
    name: 'Jade Peacock',
    colorName: 'Amber Gold, Jade Peacock Motif',
    colorHex: '#c99a3f',
    accentHex: '#2f5a4a',
    finish: 'Hand-Finished Enamel',
    inStock: true,
    image: '/images/products/catalog/flask-peacock-jade.jpg',
  },
  {
    id: 'var-flask-peacock-gold',
    name: 'Royal Peacock',
    colorName: 'Amber Gold, Peacock Motif',
    colorHex: '#c99a3f',
    accentHex: '#1f3a5f',
    finish: 'Hand-Finished Enamel',
    inStock: true,
    image: '/images/products/catalog/flask-peacock-gold.jpg',
  },
  {
    id: 'var-flask-rose-noir',
    name: 'Midnight Rose',
    colorName: 'Onyx Black, Rose Motif',
    colorHex: '#17181a',
    accentHex: '#b23a4a',
    finish: 'Hand-Finished Enamel',
    inStock: true,
    image: '/images/products/catalog/flask-rose-noir.jpg',
  },
  {
    id: 'var-flask-koi',
    name: 'Koi Garden',
    colorName: 'Amber Gold, Koi Motif',
    colorHex: '#c99a3f',
    accentHex: '#a3312c',
    finish: 'Hand-Finished Enamel',
    inStock: true,
    image: '/images/products/catalog/flask-koi.jpg',
  },
];

export const HERITAGE_FLASK: ShowcaseProduct = {
  id: 'ue-heritage-flask',
  handle: 'heritage-enamel-vacuum-flask',
  title: 'Heritage Enamel Vacuum Flask',
  tagline: 'Hand-Painted Keepsake, 300ml',
  description:
    'A small-batch vacuum flask finished by hand with traditional botanical and koi motifs over a lacquered enamel body. Small enough for a handbag, striking enough to keep on a desk.',
  details: [
    'Hand-applied enamel artwork, no two pieces identical',
    'Vacuum-sealed stainless steel core',
    'Brushed steel carry loop and twist cap',
    'Keeps drinks hot for hours in a compact form factor',
    'Presented in a branded gift box, ready to give',
  ],
  specs: [
    { label: 'Capacity', value: '300 ml / 10 oz' },
    { label: 'Material', value: 'Enamel-Coated Stainless Steel' },
    { label: 'Cap', value: 'Twist-Lock with Carry Loop' },
    { label: 'Packaging', value: 'Branded Gift Box' },
  ],
  price: 1099,
  originalPrice: 1399,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'lifestyle',
  variants: FLASK_VARIANTS,
  defaultVariantId: 'var-flask-butterfly',
  badge: 'Hand-Finished',
  image: '/images/products/catalog/flask-butterfly.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Petite Milk Thermos ─────────────────────────────────────────────────
export const THERMOS_VARIANTS: ProductVariant[] = [
  {
    id: 'var-thermos-honey',
    name: 'Honey',
    colorName: 'Warm Honey Yellow',
    colorHex: '#e8cf68',
    accentHex: '#b9973a',
    finish: 'Gloss Ceramic Coat',
    inStock: true,
    image: '/images/products/catalog/thermos-honey.jpg',
  },
  {
    id: 'var-thermos-ivory',
    name: 'Ivory',
    colorName: 'Soft Ivory Cream',
    colorHex: '#f2ecdf',
    accentHex: '#c9bfa8',
    finish: 'Gloss Ceramic Coat',
    inStock: true,
    image: '/images/products/catalog/thermos-ivory.jpg',
  },
  {
    id: 'var-thermos-blush',
    name: 'Blush',
    colorName: 'Soft Blush Pink',
    colorHex: '#f2c9cf',
    accentHex: '#d99aa3',
    finish: 'Gloss Ceramic Coat',
    inStock: true,
    image: '/images/products/catalog/thermos-blush.jpg',
  },
  {
    id: 'var-thermos-cocoa',
    name: 'Cocoa',
    colorName: 'Deep Cocoa Brown',
    colorHex: '#4a2c2a',
    accentHex: '#7a4a42',
    finish: 'Gloss Ceramic Coat',
    inStock: true,
    image: '/images/products/catalog/thermos-cocoa.jpg',
  },
];

export const PETITE_THERMOS: ShowcaseProduct = {
  id: 'ue-petite-thermos',
  handle: 'petite-milk-thermos',
  title: 'Petite Milk Thermos',
  tagline: 'Pocket Vacuum Flask with Wrist Strap, 280ml',
  description:
    'A miniature milk-bottle silhouette in gloss ceramic-coated steel, sized for a bag pocket or a car cup holder. A beaded wrist strap keeps it within reach.',
  details: [
    'Vacuum-sealed stainless steel, gloss ceramic exterior coat',
    'Keeps drinks hot or cold up to 24 hours',
    'Detachable beaded wrist strap',
    'Wide-mouth opening for easy filling and cleaning',
    'A compact, gift-ready everyday piece',
  ],
  specs: [
    { label: 'Capacity', value: '280 ml / 9.5 oz' },
    { label: 'Material', value: 'SUS 316 Stainless Steel' },
    { label: 'Finish', value: 'Gloss Ceramic Coat' },
    { label: 'Included', value: 'Beaded Wrist Strap' },
  ],
  price: 799,
  originalPrice: 999,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'tumbler',
  variants: THERMOS_VARIANTS,
  defaultVariantId: 'var-thermos-ivory',
  badge: 'Pocket Size',
  image: '/images/products/catalog/thermos-ivory.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Rabbit-Ear Glass Jar ─────────────────────────────────────────────────
export const JAR_VARIANTS: ProductVariant[] = [
  {
    id: 'var-jar-rosewater',
    name: 'Rosewater',
    colorName: 'Dusty Rose Pink',
    colorHex: '#e18ea0',
    accentHex: '#dfc08a',
    finish: 'Soft-Touch Silicone Collar',
    inStock: true,
    image: '/images/products/catalog/jar-rosewater.jpg',
  },
  {
    id: 'var-jar-sage',
    name: 'Sage',
    colorName: 'Muted Sage Green',
    colorHex: '#9db696',
    accentHex: '#dfc08a',
    finish: 'Soft-Touch Silicone Collar',
    inStock: true,
    image: '/images/products/catalog/jar-sage.jpg',
  },
  {
    id: 'var-jar-ivory',
    name: 'Ivory',
    colorName: 'Warm Ivory Cream',
    colorHex: '#ecdfc2',
    accentHex: '#dfc08a',
    finish: 'Soft-Touch Silicone Collar',
    inStock: true,
    image: '/images/products/catalog/jar-ivory.jpg',
  },
];

export const RABBIT_JAR: ShowcaseProduct = {
  id: 'ue-rabbit-jar',
  handle: 'rabbit-ear-glass-jar',
  title: 'Rabbit-Ear Glass Jar',
  tagline: 'Borosilicate Glass Tumbler with Straw, 350ml',
  description:
    'A playful glass tumbler with a gold-eared flip lid and a soft silicone collar. Clear borosilicate glass lets the drink show through — equally at home holding iced tea or a desk succulent.',
  details: [
    'Borosilicate glass body, shatter-resistant',
    'Gold-accented flip lid with built-in straw',
    'Soft-touch silicone grip collar',
    'Hand-wash recommended to preserve the gold finish',
  ],
  specs: [
    { label: 'Capacity', value: '350 ml / 12 oz' },
    { label: 'Material', value: 'Borosilicate Glass' },
    { label: 'Lid', value: 'Flip-Top with Straw' },
  ],
  price: 649,
  originalPrice: 849,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'lifestyle',
  variants: JAR_VARIANTS,
  defaultVariantId: 'var-jar-rosewater',
  badge: 'Editorial Favorite',
  image: '/images/products/catalog/jar-rosewater.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Self-Stirring Mixing Cup ─────────────────────────────────────────────
export const STIRRING_CUP: ShowcaseProduct = {
  id: 'ue-stirring-cup',
  handle: 'automatic-self-stirring-mixing-cup-450ml',
  title: 'Self-Stirring Mixing Cup',
  tagline: 'Automatic Stirring Glass Mug, 450ml',
  description:
    'A clear glass mixing cup with a one-touch stirring base built in — add your coffee, milk or cocoa and let it blend itself. The beige handle and marked measurements make it as practical as it is good-looking on a desk or counter.',
  details: [
    'One-touch automatic stirring mechanism',
    'Transparent glass body with measurement markings',
    'Removable stirring attachment for easy cleaning',
    'Comfortable beige handle and control base',
    'Suited to coffee, milk, hot chocolate and light beverages',
  ],
  specs: [
    { label: 'Capacity', value: '450 ml' },
    { label: 'Material', value: 'Glass' },
    { label: 'Mechanism', value: 'Automatic Stirring Base' },
  ],
  price: 549,
  originalPrice: 999,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'lifestyle',
  variants: [
    {
      id: 'var-stirringcup-classic',
      name: 'Classic',
      colorName: 'Clear Glass, Beige Base',
      colorHex: '#cfd6d2',
      accentHex: '#c9a36a',
      finish: 'Glass & Steel',
      inStock: true,
      image: '/images/products/new/stirring-cup.jpg',
    },
  ],
  defaultVariantId: 'var-stirringcup-classic',
  image: '/images/products/new/stirring-cup.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Vitalize Insulated Shaker Bottle ─────────────────────────────────────
export const SHAKER_BOTTLE: ShowcaseProduct = {
  id: 'ue-shaker-bottle',
  handle: 'vitalize-insulated-shaker-bottle-591ml',
  title: 'Vitalize Insulated Shaker Bottle',
  tagline: 'Double-Wall Steel Shaker with Strainer, 591ml',
  description:
    'Built for protein shakes and pre-workout mixes, this insulated steel shaker pairs a removable strainer with a leakproof fast-flow lid and a small base compartment for extra powder. The recessed handle and cup-holder-friendly shape make it as easy to carry to the gym as it is to the car.',
  details: [
    'Double-wall vacuum insulated steel body',
    'Removable strainer breaks up powder clumps while shaking',
    'Leakproof lid with fast-flow spout and tethered cap',
    '3 oz base compartment for supplement storage',
    'Recessed easy-grip handle, cup-holder compatible',
  ],
  specs: [
    { label: 'Capacity', value: '591 ml / 20 oz' },
    { label: 'Material', value: 'Stainless Steel' },
    { label: 'Insulation', value: 'Double-Wall Vacuum' },
  ],
  price: 1299,
  originalPrice: 1699,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'tumbler',
  variants: [
    {
      id: 'var-shaker-green',
      name: 'Forest Green',
      colorName: 'Forest Green',
      colorHex: '#5c7a52',
      accentHex: '#8c7456',
      finish: 'Matte Steel',
      inStock: true,
    },
  ],
  defaultVariantId: 'var-shaker-green',
  // No image: the doc's photo for this one is a competitor's own branded
  // product listing (visible "STANLEY" logo), not this store's own stock —
  // needs a genuine product photo before this can be shown with one.
  image: '',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Crystal Rotating Glass ────────────────────────────────────────────────
export const CRYSTAL_ROTATING_GLASS: ShowcaseProduct = {
  id: 'ue-crystal-rotating-glass',
  handle: 'crystal-rotating-glass-led-light-base',
  title: 'Crystal Rotating Glass with LED Light Base',
  tagline: 'Faceted Decorative Glass, Rotating LED Base',
  description:
    'A faceted crystal-style glass that slowly rotates on its illuminated base, catching warm LED light through every cut angle. A decorative tabletop piece rather than drinkware — a quiet, glowing accent for a console, bar cart or bedside table.',
  details: [
    'Diamond-cut faceted crystal-style glass',
    'Motorized rotating base with warm LED illumination',
    'Simple touch ON/OFF control',
    'Decorative tabletop piece, not intended for beverages',
    'A distinctive gift for birthdays, housewarmings and anniversaries',
  ],
  specs: [
    { label: 'Type', value: 'Decorative Rotating Glass' },
    { label: 'Lighting', value: 'Warm LED' },
    { label: 'Control', value: 'Touch ON/OFF' },
  ],
  price: 799,
  originalPrice: 999,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'lifestyle',
  variants: [
    {
      id: 'var-crystalglass-clear',
      name: 'Clear Crystal',
      colorName: 'Clear Crystal',
      colorHex: '#e3e6e0',
      accentHex: '#dfc08a',
      finish: 'Faceted Glass',
      inStock: true,
      image: '/images/products/new/crystal-rotating-glass.jpg',
    },
  ],
  defaultVariantId: 'var-crystalglass-clear',
  image: '/images/products/new/crystal-rotating-glass.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Amber Ribbed Glass Water Jug Set ──────────────────────────────────────
export const AMBER_JUG_SET: ShowcaseProduct = {
  id: 'ue-amber-jug-set',
  handle: 'amber-ribbed-glass-water-jug-set-1-4l',
  title: 'Amber Ribbed Glass Water Jug Set',
  tagline: '1.4L Jug with 4 Matching 260ml Glasses',
  description:
    'A five-piece serving set in warm amber-toned glass, its vertical ribbing catching the light across the jug and all four matching tumblers. The curved handle and pouring spout make it as easy to use daily as it is to bring out for guests.',
  details: [
    '1.4L jug with matching lid and curved pouring handle',
    'Four matching 260ml ribbed tumblers',
    'Warm amber-toned transparent glass finish',
    'Vertical ribbed texture across the full set',
    'Suited to water, juice, lemonade and everyday serving',
  ],
  specs: [
    { label: 'Set Size', value: '5 Pieces' },
    { label: 'Jug Capacity', value: '1.4 L' },
    { label: 'Glass Capacity', value: '260 ml each' },
  ],
  price: 1099,
  originalPrice: 1399,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'gift-set',
  variants: [
    {
      id: 'var-amberjug-amber',
      name: 'Amber',
      colorName: 'Amber / Golden Transparent',
      colorHex: '#c9915a',
      accentHex: '#8c6a3a',
      finish: 'Ribbed Glass',
      inStock: true,
      image: '/images/products/new/amber-jug-set.jpg',
    },
  ],
  defaultVariantId: 'var-amberjug-amber',
  image: '/images/products/new/amber-jug-set.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Avocado Glass Tumbler ─────────────────────────────────────────────────
export const AVOCADO_TUMBLER: ShowcaseProduct = {
  id: 'ue-avocado-tumbler',
  handle: 'avocado-glass-tumbler-green-lid-straw',
  title: 'Avocado Glass Tumbler',
  tagline: 'Glass Tumbler with Green Lid & Glass Straw',
  description:
    'A playful avocado-print tumbler in clear glass, finished with a bright green lid and a matching reusable glass straw. Wide-mouthed for easy filling and cleaning — a cheerful everyday piece for iced coffee, smoothies and cold drinks.',
  details: [
    'Clear glass tumbler with avocado print',
    'Green lid with matching reusable glass straw',
    'Wide-mouth design for easy filling and cleaning',
    'Suited to iced coffee, juice, smoothies and cold drinks',
  ],
  specs: [
    { label: 'Material', value: 'Glass' },
    { label: 'Lid', value: 'Green, with Glass Straw' },
  ],
  price: 599,
  originalPrice: 799,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'tumbler',
  variants: [
    {
      id: 'var-avocado-green',
      name: 'Avocado Green',
      colorName: 'Avocado Green',
      colorHex: '#7a9a4a',
      accentHex: '#4a6a2a',
      finish: 'Printed Glass',
      inStock: true,
      image: '/images/products/new/avocado-tumbler.jpg',
    },
  ],
  defaultVariantId: 'var-avocado-green',
  image: '/images/products/new/avocado-tumbler.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Bear Glass Cup ────────────────────────────────────────────────────────
export const BEAR_GLASS_CUP: ShowcaseProduct = {
  id: 'ue-bear-glass-cup',
  handle: 'bear-glass-cup-yellow-hat-straw',
  title: 'Bear Glass Cup',
  tagline: '3D Teddy Bear Cup with Yellow Hat Lid & Straw',
  description:
    'A clear glass cup shaped like a seated teddy bear, topped with a ribbed yellow hat-style lid and a green-and-white striped straw. A fun, collectible shape for iced coffee, smoothies and milkshakes — equally at home on a desk or in a gift box.',
  details: [
    '3D teddy bear-shaped glass body',
    'Ribbed yellow hat-style lid',
    'Green-and-white striped straw included',
    'Suited to iced coffee, smoothies, milkshakes and juice',
  ],
  specs: [
    { label: 'Material', value: 'Glass' },
    { label: 'Lid', value: 'Yellow, Hat-Style' },
  ],
  price: 649,
  originalPrice: 849,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'tumbler',
  variants: [
    {
      id: 'var-bearcup-yellow',
      name: 'Yellow Hat',
      colorName: 'Yellow Hat',
      colorHex: '#e8c44a',
      accentHex: '#7a9a6a',
      finish: 'Printed Glass',
      inStock: true,
      image: '/images/products/new/bear-glass-cup.jpg',
    },
  ],
  defaultVariantId: 'var-bearcup-yellow',
  image: '/images/products/new/bear-glass-cup.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Yellow Mini Thermos Bottle ────────────────────────────────────────────
export const MINI_THERMOS: ShowcaseProduct = {
  id: 'ue-mini-thermos',
  handle: 'yellow-mini-thermos-bottle-200ml',
  title: 'Yellow Mini Thermos Bottle',
  tagline: 'Compact Vacuum Flask, 200ml',
  description:
    'A pocket-sized vacuum flask in bright yellow, built to carry just enough coffee, tea or water through a short commute or school day. The stainless-steel interior and secure screw lid with carry handle make it easy to toss in a bag and go.',
  details: [
    '200ml compact capacity',
    'Stainless-steel vacuum-insulated interior',
    'Screw-style lid with green carry handle',
    'Lightweight enough for a handbag or backpack',
  ],
  specs: [
    { label: 'Capacity', value: '200 ml' },
    { label: 'Material', value: 'Stainless Steel' },
    { label: 'Model', value: 'DY-BW734' },
  ],
  price: 449,
  originalPrice: 699,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'tumbler',
  variants: [
    {
      id: 'var-minithermos-yellow',
      name: 'Yellow',
      colorName: 'Yellow',
      colorHex: '#e8c23a',
      accentHex: '#5c8a5a',
      finish: 'Gloss Steel',
      inStock: true,
      image: '/images/products/new/mini-thermos-yellow.jpg',
    },
  ],
  defaultVariantId: 'var-minithermos-yellow',
  image: '/images/products/new/mini-thermos-yellow.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Ribbed Glass Cup with Bamboo Lid ──────────────────────────────────────
export const BAMBOO_LID_CUP: ShowcaseProduct = {
  id: 'ue-bamboo-lid-cup',
  handle: 'ribbed-glass-cup-bamboo-lid-straw',
  title: 'Ribbed Glass Cup with Bamboo Lid',
  tagline: 'Vertical-Fluted Glass with Bamboo Lid & Straw',
  description:
    'A clean-lined glass tumbler with a vertical ribbed texture, topped with a natural bamboo lid and a reusable glass straw. A quiet, minimalist everyday piece for iced coffee, smoothies and water at home, the office or a café setup.',
  details: [
    'Clear ribbed/fluted glass body',
    'Natural bamboo lid with centre straw opening',
    'Reusable transparent glass straw included',
    'Suited to iced coffee, smoothies, juice and water',
  ],
  specs: [
    { label: 'Material', value: 'Glass' },
    { label: 'Lid', value: 'Natural Bamboo' },
  ],
  price: 549,
  originalPrice: 699,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'tumbler',
  variants: [
    {
      id: 'var-bamboocup-natural',
      name: 'Natural Bamboo',
      colorName: 'Clear Glass, Natural Bamboo',
      colorHex: '#cdd6d2',
      accentHex: '#a9835a',
      finish: 'Ribbed Glass',
      inStock: true,
      image: '/images/products/new/bamboo-lid-cup.jpg',
    },
  ],
  defaultVariantId: 'var-bamboocup-natural',
  image: '/images/products/new/bamboo-lid-cup.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Decorative LED Lantern ────────────────────────────────────────────────
export const LED_LANTERN: ShowcaseProduct = {
  id: 'ue-led-lantern',
  handle: 'decorative-led-lantern-flameless-candle',
  title: 'Decorative LED Lantern',
  tagline: 'Vintage-Style Lantern with Flameless Candle',
  description:
    'A vintage-inspired lantern frame with a flameless LED candle inside, bringing a warm glow without any flame to watch. An ON/OFF/timer switch with a 5-hour auto-off makes it easy to light a table, balcony or festive setup and forget it.',
  details: [
    'Vintage lantern-style frame with window panels',
    'Flameless, smoke-free LED candle',
    'ON / OFF / 5-hour timer switch',
    'Top ring for tabletop or hanging display',
    'Runs on 3 × AAA batteries (not included)',
  ],
  specs: [
    { label: 'Light Type', value: 'Flameless LED' },
    { label: 'Timer', value: '5 Hours' },
    { label: 'Power', value: '3 × AAA (not included)' },
  ],
  price: 599,
  originalPrice: 999,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'lifestyle',
  variants: [
    {
      id: 'var-ledlantern-black',
      name: 'Black',
      colorName: 'Black',
      colorHex: '#2b2b2b',
      accentHex: '#dfc08a',
      finish: 'Metal Frame',
      inStock: true,
      image: '/images/products/new/led-lantern.jpg',
    },
  ],
  defaultVariantId: 'var-ledlantern-black',
  image: '/images/products/new/led-lantern.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Ribbed Glass Beverage Dispenser ───────────────────────────────────────
export const BEVERAGE_DISPENSER: ShowcaseProduct = {
  id: 'ue-beverage-dispenser',
  handle: 'ribbed-glass-beverage-dispenser-lid-tap',
  title: 'Ribbed Glass Beverage Dispenser',
  tagline: 'Vertical-Ribbed Glass Dispenser with Tap',
  description:
    'A clear ribbed-glass dispenser for the counter or table, with a screw-on lid and a built-in tap so guests can pour themselves without lifting the whole thing. Equally suited to infused water, juice or lemonade at a dinner or a weekday breakfast.',
  details: [
    'Clear vertically-ribbed glass body',
    'Screw-on lid with built-in dispensing tap',
    'Rectangular shape suited to counters and serving stations',
    'Suited to water, juice, lemonade and other cold beverages',
  ],
  specs: [
    { label: 'Material', value: 'Glass' },
    { label: 'Dispensing', value: 'Built-In Tap' },
  ],
  price: 999,
  originalPrice: 1499,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'lifestyle',
  variants: [
    {
      id: 'var-dispenser-clear',
      name: 'Clear Ribbed',
      colorName: 'Clear Ribbed',
      colorHex: '#d6dcd4',
      accentHex: '#8c9a8c',
      finish: 'Ribbed Glass',
      inStock: true,
      image: '/images/products/new/beverage-dispenser.jpg',
    },
  ],
  defaultVariantId: 'var-dispenser-clear',
  image: '/images/products/new/beverage-dispenser.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── The Everyday Tumbler (1200ml) ─────────────────────────────────────────
export const EVERYDAY_TUMBLER_VARIANTS: ProductVariant[] = [
  {
    id: 'var-everyday-black',
    name: 'Black',
    colorName: 'Black Ombre',
    colorHex: '#1f1f1f',
    accentHex: '#8c7456',
    finish: 'Matte Steel',
    inStock: true,
    image: '/images/products/new/everyday-tumbler-black.jpg',
  },
  {
    id: 'var-everyday-pink',
    name: 'Pink',
    colorName: 'Pink Ombre',
    colorHex: '#ec9fc0',
    accentHex: '#c9789a',
    finish: 'Matte Steel',
    inStock: true,
    image: '/images/products/new/everyday-tumbler-pink.jpg',
  },
  {
    id: 'var-everyday-blue',
    name: 'Turquoise',
    colorName: 'Turquoise',
    colorHex: '#3dd6c9',
    accentHex: '#2a9a90',
    finish: 'Matte Steel',
    inStock: true,
    image: '/images/products/new/everyday-tumbler-blue.jpg',
  },
  {
    id: 'var-everyday-lightgreen',
    name: 'Light Green',
    colorName: 'Light Green Ombre',
    colorHex: '#9ad68a',
    accentHex: '#6a9a5c',
    finish: 'Matte Steel',
    inStock: true,
    image: '/images/products/new/everyday-tumbler-lightgreen.jpg',
  },
  {
    id: 'var-everyday-whitered',
    name: 'White & Red',
    colorName: 'White, Red Accent',
    colorHex: '#f2ece0',
    accentHex: '#b5402f',
    finish: 'Matte Steel',
    inStock: true,
    image: '/images/products/new/everyday-tumbler-whitered.jpg',
  },
];

export const EVERYDAY_TUMBLER: ShowcaseProduct = {
  id: 'ue-everyday-tumbler',
  handle: '1200ml-steel-tumbler-handle-straw',
  title: 'The Everyday Tumbler',
  tagline: '1200ml Steel Tumbler with Handle & Steel Straw',
  description:
    'A generously sized steel tumbler built to cut down on refills, with a side handle for an easy carry and a reusable steel straw under a transparent lid. A straightforward everyday companion for the gym, the office or a long drive.',
  details: [
    '1200ml large capacity',
    'Stainless-steel tumbler body',
    'Reusable steel straw, transparent lid',
    'Comfortable side handle for carrying',
    'Suited to water, iced coffee, juice and smoothies',
  ],
  specs: [
    { label: 'Capacity', value: '1200 ml / 40 oz' },
    { label: 'Material', value: 'Stainless Steel' },
    { label: 'Straw', value: 'Reusable Steel' },
  ],
  price: 799,
  originalPrice: 1299,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'tumbler',
  variants: EVERYDAY_TUMBLER_VARIANTS,
  defaultVariantId: 'var-everyday-black',
  image: '/images/products/new/everyday-tumbler-black.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

// ── Character Water Bottle Collection ────────────────────────────────────
export const CHARACTER_BOTTLE_VARIANTS: ProductVariant[] = [
  {
    id: 'var-character-panda',
    name: 'Panda',
    colorName: 'Panda',
    colorHex: '#f2f2f0',
    accentHex: '#1a1a1a',
    finish: 'Printed Finish',
    inStock: true,
    image: '/images/products/new/character-bottle-panda.jpg',
    modelGlb: '/models/character-bottle-panda.glb',
  },
  {
    id: 'var-character-elephant',
    name: 'Elephant',
    colorName: 'Lavender Elephant',
    colorHex: '#9f90d6',
    accentHex: '#6a4a8c',
    finish: 'Printed Finish',
    inStock: true,
    image: '/images/products/new/character-bottle-elephant.jpg',
  },
];

export const CHARACTER_BOTTLE: ShowcaseProduct = {
  id: 'ue-character-bottle',
  handle: 'cute-character-water-bottle-collection',
  title: 'Character Water Bottle',
  tagline: 'Playful Animal-Print Bottle, Two Designs',
  description:
    'A playful water bottle with animal-inspired character lids and bright printed bodies — choose Panda or Elephant. Sized for school, travel and everyday carry, and an easy, cheerful gift for kids and teens.',
  details: [
    'Playful character-shaped lid designs',
    'Vibrant printed bottle body',
    'Available in Panda and Elephant',
    'Suited to school, travel, office and everyday carry',
    'A cheerful birthday or return-gift option',
  ],
  specs: [{ label: 'Design', value: 'Character Print' }],
  price: 399,
  originalPrice: 599,
  currency: 'INR',
  currencySymbol: '₹',
  category: 'tumbler',
  variants: CHARACTER_BOTTLE_VARIANTS,
  defaultVariantId: 'var-character-panda',
  image: '/images/products/new/character-bottle-panda.jpg',
  availability: 'In Stock',
  shipsIn: 'Dispatches within 24 Hours',
  giftNoteIncluded: true,
};

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  HERO_TUMBLERS[0],
  HERITAGE_FLASK,
  PETITE_THERMOS,
  RABBIT_JAR,
  STIRRING_CUP,
  SHAKER_BOTTLE,
  CRYSTAL_ROTATING_GLASS,
  AMBER_JUG_SET,
  AVOCADO_TUMBLER,
  BEAR_GLASS_CUP,
  MINI_THERMOS,
  BAMBOO_LID_CUP,
  LED_LANTERN,
  BEVERAGE_DISPENSER,
  EVERYDAY_TUMBLER,
  CHARACTER_BOTTLE,
];

