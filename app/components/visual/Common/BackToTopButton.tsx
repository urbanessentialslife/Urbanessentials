import React, { useEffect, useState } from 'react';

/**
 * Floating scroll-to-top control. Appears only once the visitor has
 * scrolled past the showroom's cinematic entrance sequence into the
 * regular catalog below — not during that sequence itself, where a
 * stray floating control breaks the immersion.
 */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const showroom = document.getElementById('showroom');
      const threshold = showroom
        ? showroom.getBoundingClientRect().bottom + window.scrollY
        : window.innerHeight * 3;
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 w-12 h-12 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#dfc08a] shadow-[0_12px_32px_rgba(0,0,0,0.35)] flex items-center justify-center cursor-pointer transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
