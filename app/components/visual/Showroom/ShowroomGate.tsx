import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollFrameSequence } from '~/components/visual/Common/ScrollFrameSequence';

const ENTRANCE_FRAMES_PATH = '/frames/entrance';
const ENTRANCE_FRAME_COUNT = 280;

/**
 * Scroll-Scrubbed Flagship Store Walk-Through.
 *
 * A single continuous cinematic shot — closed glass doors on the street,
 * dollying straight through the open doorway into the boutique interior —
 * with its playback position driven directly by scroll progress. Rendered
 * as a canvas frame sequence rather than a <video>: setting
 * `video.currentTime` on every scroll tick gets silently coalesced by the
 * browser (verified — 40 rapid seeks in, 1 `seeked` event out), which is
 * what made this feel laggy no matter how the source file was encoded.
 * See ScrollFrameSequence for the full story.
 */
export function ShowroomGate() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // Smooth scroll jump to the next section
  const handleExploreClick = useCallback(() => {
    const el = document.getElementById('shop') || document.getElementById('featured') || document.getElementById('journey');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !triggerRef.current || !pinRef.current) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setProgress(1); // Freeze on the final interior frame rather than scrubbing.
      return;
    }

    // Scoped to a gsap.context() so cleanup fully reverts every DOM
    // mutation the pin plugin makes (inline styles, the pin spacer it
    // inserts, etc). React 18 StrictMode mounts, cleans up, then mounts
    // this effect again in dev; a bare `tl.kill()` doesn't undo the pin
    // spacer from that first pass, which left the video element stuck
    // mid-unpin (permanently position:fixed, off-screen) — the actual
    // cause of the dead-scroll gap below this section. ctx.revert() undoes
    // it cleanly so the second mount starts from a truly clean slate.
    const ctx = gsap.context(() => {
      const pinEl = pinRef.current!;
      const scrollCue = pinEl.querySelector('.scroll-cue');
      const boutiqueHud = pinEl.querySelector('.boutique-hud');

      gsap.set(boutiqueHud, { opacity: 0, y: 15 });

      // Master Scroll-Linked Timeline (Direct GPU Scrubbing)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: pinEl,
          pinSpacing: true,
          scrub: 0.5,
          onUpdate: (self) => setProgress(self.progress),
        },
      });

      tl.to(scrollCue, { opacity: 0, duration: 0.15, ease: 'power1.out' }, 0.03)
        .to(boutiqueHud, { opacity: 1, y: 0, duration: 0.1, ease: 'power1.out' }, 0.62)
        // A long, unhurried hold inside the boutique — scrolling through
        // this stretch shouldn't rush past the interior. The HUD simply
        // fades as the pin nears release; the next section picks up
        // directly from there, with no intervening black-cut of its own.
        .to(boutiqueHud, { opacity: 0, duration: 0.08, ease: 'power1.in' }, 0.92);
    }, triggerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={triggerRef} id="showroom" className="relative w-full h-[320vh]">
      <div ref={pinRef} className="relative w-full h-screen overflow-hidden bg-black">
        {/* ── SCROLL-SCRUBBED ENTRANCE WALK-THROUGH ── */}
        <ScrollFrameSequence
          basePath={ENTRANCE_FRAMES_PATH}
          frameCount={ENTRANCE_FRAME_COUNT}
          progress={progress}
          className="absolute inset-0 w-full h-full"
        />

        {/* ── REFINED BOTTOM BOUTIQUE HUD & NAVIGATION CUE ── */}
        <div className="boutique-hud absolute inset-x-0 bottom-8 sm:bottom-10 flex flex-col items-center text-center px-6 pointer-events-none will-change-transform z-30 opacity-0">
          <div className="flex items-center gap-4 sm:gap-6 px-6 py-2.5 rounded-full bg-[#0c1017]/85 backdrop-blur-md border border-[#dfc08a]/30 shadow-2xl pointer-events-auto">
            {/* The "Flagship Boutique" badge and divider don't fit next to
                the CTA at mobile widths without wrapping mid-word — show
                just the Explore CTA there, the badge from sm: up. */}
            <div aria-hidden="true" className="hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs uppercase tracking-[0.25em] font-medium text-[#fdfaf5] whitespace-nowrap">
                Flagship Boutique
              </span>
            </div>
            <span aria-hidden="true" className="hidden sm:block w-px h-3 bg-white/20" />
            <button
              type="button"
              onClick={handleExploreClick}
              className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[#dfc08a] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Explore Collection</span>
              <span className="animate-bounce">↓</span>
            </button>
          </div>
        </div>

        {/* ── INITIAL SCROLL CUE ── */}
        <div className="scroll-cue absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1.5 z-40 pointer-events-none transition-opacity duration-300">
          <div className="w-4 h-7 rounded-full border border-white/40 flex justify-center p-1 backdrop-blur-xs bg-black/40">
            <div className="w-1 h-2 bg-[#dfc08a] rounded-full animate-bounce" />
          </div>
          <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-[#fdfaf5]/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            Scroll to enter
          </span>
        </div>
      </div>
    </div>
  );
}
