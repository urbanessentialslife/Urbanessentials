import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router';

/**
 * A small corner spinner shown only once a route transition has been
 * loading for a noticeable moment — most navigations resolve fast enough
 * that RouteProgressBar's thin top line is all a visitor sees. This covers
 * the slower ones (a cold Storefront API round trip on a collection or
 * product page) with a more explicit "something is happening" signal than
 * a 2px bar alone communicates.
 */
export function NavigationSpinner() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== 'idle';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }
    // Delayed so a fast navigation never flashes a spinner that's gone
    // before anyone could actually see it.
    const timeout = setTimeout(() => setVisible(true), 350);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 z-[100] w-10 h-10 rounded-full bg-[#241a16]/95 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center justify-center pointer-events-none"
    >
      <svg
        className="w-4.5 h-4.5 animate-spin text-[#dfc08a]"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}
