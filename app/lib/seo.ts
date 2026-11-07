import type {MetaDescriptor} from 'react-router';

/**
 * Central SEO helper — every route's `meta` export goes through buildMeta()
 * so titles, descriptions, canonical URLs, Open Graph / Twitter cards and
 * robots directives stay consistent sitewide.
 *
 * Canonical + OG URLs always point at the store's primary domain (from
 * Shopify's `shop.primaryDomain`, loaded by the root route), never the
 * domain the request happened to arrive on — so Oxygen preview URLs,
 * *.myshopify.com and localhost never compete with urbanessentials.life
 * in search results.
 */

export const SITE_NAME = 'Urban Essentials';
export const FALLBACK_ORIGIN = 'https://urbanessentials.life';
export const DEFAULT_DESCRIPTION =
  'Shop premium insulated tumblers, Stanley cups, water bottles, mugs, home décor and luxury gift sets at Urban Essentials. Thoughtful gifts with free delivery across India.';
export const DEFAULT_OG_IMAGE = '/images/brand/logo-full.png';

type MetaMatch = {id: string; data?: unknown; loaderData?: unknown} | undefined;

interface RootDataShape {
  origin?: string;
  header?: {shop?: {primaryDomain?: {url?: string} | null} | null} | null;
}

/** Primary storefront origin (no trailing slash), resolved from root loader data. */
export function siteOrigin(matches?: ReadonlyArray<MetaMatch>): string {
  const root = matches?.find((m) => m?.id === 'root');
  const data = (root?.data ?? root?.loaderData) as RootDataShape | undefined;
  const primary = data?.header?.shop?.primaryDomain?.url;
  // A *.myshopify.com primary domain means the custom domain isn't
  // connected (or the header query fell back) — use the real site instead.
  if (primary && !primary.includes('myshopify.com')) return trimSlash(primary);
  return FALLBACK_ORIGIN;
}

export function absoluteUrl(origin: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('//')) return `https:${pathOrUrl}`;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trim to ~160 chars on a word boundary — the length Google displays. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

/** Fixes the "Ubran" typo that appears in many Shopify product titles. */
export function cleanBrandTypos(text: string): string {
  return text.replace(/\bUbran\b/g, 'Urban');
}

function trimSlash(url: string) {
  return url.replace(/\/+$/, '');
}

export interface BuildMetaOptions {
  matches?: ReadonlyArray<MetaMatch>;
  location?: {pathname: string};
  /** Page title without the brand — " | Urban Essentials" is appended automatically. */
  title: string;
  /** Use the title exactly as given (e.g. homepage, or a Shopify SEO title). */
  exactTitle?: boolean;
  description?: string;
  /** Canonical path. Defaults to the current pathname (query string dropped). */
  path?: string;
  image?: string | null;
  imageAlt?: string | null;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  /** Extra tags, e.g. product:price:amount. */
  extra?: MetaDescriptor[];
  /** Structured data objects rendered as <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown>[];
}

export function buildMeta(options: BuildMetaOptions): MetaDescriptor[] {
  const origin = siteOrigin(options.matches);
  const title = cleanBrandTypos(
    options.exactTitle || options.title.includes(SITE_NAME)
      ? options.title
      : `${options.title} | ${SITE_NAME}`,
  );
  const description = truncate(cleanBrandTypos(options.description || DEFAULT_DESCRIPTION));
  const path = options.path ?? options.location?.pathname ?? '/';
  const url = absoluteUrl(origin, path === '/' ? '/' : path.replace(/\/+$/, ''));
  const image = absoluteUrl(origin, options.image || DEFAULT_OG_IMAGE);
  const imageAlt = options.imageAlt || title;

  const tags: MetaDescriptor[] = [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: url},
    {
      name: 'robots',
      content: options.noindex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1',
    },
    {property: 'og:site_name', content: SITE_NAME},
    {property: 'og:locale', content: 'en_IN'},
    {property: 'og:type', content: options.type ?? 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: url},
    {property: 'og:image', content: image},
    {property: 'og:image:alt', content: imageAlt},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    {name: 'twitter:image', content: image},
    ...(options.extra ?? []),
  ];

  for (const data of options.jsonLd ?? []) {
    tags.push({'script:ld+json': data} as MetaDescriptor);
  }

  return tags;
}

/** schema.org BreadcrumbList from [name, path] pairs. */
export function breadcrumbJsonLd(
  origin: string,
  crumbs: {name: string; path: string}[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: cleanBrandTypos(crumb.name),
      item: absoluteUrl(origin, crumb.path),
    })),
  };
}
