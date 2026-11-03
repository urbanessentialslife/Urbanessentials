import { Image } from '@shopify/hydrogen';
import { Breadcrumb } from '~/components/visual/Common/Breadcrumb';

interface Crumb {
  label: string;
  to?: string;
}

interface ShopPageHeaderProps {
  title: string;
  breadcrumbs: Crumb[];
  bannerImage?: { url: string; altText?: string | null } | null;
}

/** Shared header for the shop/category browsing pages — breadcrumb, title, and an
 * optional collection banner — so "Shop All" and every collection page read as one
 * consistent section of the site rather than a bare product grid. Deliberately terse
 * (no description paragraph): a one-line title + count reads cleaner above a product
 * grid than a long block of marketing copy followed by a wall of empty space. */
export function ShopPageHeader({
  title,
  breadcrumbs,
  bannerImage,
}: ShopPageHeaderProps) {
  return (
    <div className="bg-[#f4f0e8] font-sans">
      <Breadcrumb items={breadcrumbs} className="max-w-7xl mx-auto px-6 md:px-12 pt-28" />

      {bannerImage && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">
          <div className="aspect-[21/9] sm:aspect-[3/1] rounded-3xl overflow-hidden bg-[#e8e1d4]">
            <Image
              data={bannerImage}
              sizes="(min-width: 768px) 1152px, 100vw"
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16]">
          {title}
        </h1>
      </div>
    </div>
  );
}
