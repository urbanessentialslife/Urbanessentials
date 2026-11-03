import {useState} from 'react';
import type {NavMenu} from '~/lib/navMenus';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {ShowcaseCartProvider} from '~/context/ShowcaseCartContext';
import {ShowcaseHeader} from '~/components/visual/Common/ShowcaseHeader';
import {ShowcaseFooter} from '~/components/visual/Common/ShowcaseFooter';
import {ShowcaseCartDrawer} from '~/components/visual/Common/ShowcaseCartDrawer';
import {HeaderSearchOverlay} from '~/components/visual/Common/HeaderSearchOverlay';
import {BackToTopButton} from '~/components/visual/Common/BackToTopButton';
import {RouteProgressBar} from '~/components/visual/Common/RouteProgressBar';
import {NavigationSpinner} from '~/components/visual/Common/NavigationSpinner';
import {SupportChatButton} from '~/components/visual/Common/SupportChatButton';
import {CompareProvider} from '~/context/CompareContext';
import {CompareBar} from '~/components/visual/Shop/CompareBar';
import {WishlistProvider} from '~/context/WishlistContext';
import {RecentlyViewedProvider} from '~/context/RecentlyViewedContext';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  supportEmail?: string | null;
  whatsappNumber?: string | null;
  categories?: {handle: string; title: string}[];
  navCollectionImages?: Record<string, string>;
  navMenus?: NavMenu[];
  children?: React.ReactNode;
}

export function PageLayout({
  children = null,
  isLoggedIn,
  categories = [],
  navCollectionImages,
  navMenus,
  supportEmail,
  whatsappNumber,
}: PageLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ShowcaseCartProvider>
      <CompareProvider>
        <WishlistProvider>
          <RecentlyViewedProvider>
            <div className="urbanessentials-showcase min-h-screen bg-white text-[#241a16] selection:bg-[#b89b6a] selection:text-[#241a16]">
              <RouteProgressBar />
              <NavigationSpinner />
              <ShowcaseHeader isLoggedIn={isLoggedIn} categories={categories} collectionImages={navCollectionImages} menus={navMenus} onOpenSearch={() => setIsSearchOpen(true)} />
              <main>{children}</main>
              <ShowcaseFooter />
              <ShowcaseCartDrawer isLoggedIn={isLoggedIn} />
              <HeaderSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
              <BackToTopButton />
              <SupportChatButton supportEmail={supportEmail} whatsappNumber={whatsappNumber} />
              <CompareBar />
            </div>
          </RecentlyViewedProvider>
        </WishlistProvider>
      </CompareProvider>
    </ShowcaseCartProvider>
  );
}

