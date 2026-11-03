import React, { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { LogoMark } from '../Common/Logo';

interface TheatricalCurtainProps {
  /** Scroll progress of the showroom section (0 to 1) */
  progress: number;
  /** Curtain open progress (0 = closed, 1 = fully gathered at walls) */
  curtainOpen: number;
  /** Whether the user has prefers-reduced-motion active */
  reducedMotion?: boolean;
}

/**
 * 12 individual vertical fabric flutes per curtain panel.
 * Each flute has subtle organic width and highlight variance to emulate
 * authentic hand-hung heavy silk drapery with deep valleys and lit ridges.
 */
const FLUTE_COUNT = 12;
const FLUTE_ITEMS = Array.from({ length: FLUTE_COUNT }, (_, i) => ({
  id: `flute-segment-${i + 1}`,
  index: i,
}));

export function TheatricalCurtain({
  progress,
  curtainOpen,
  reducedMotion = false,
}: TheatricalCurtainProps) {
  const sealRef = useRef<HTMLDivElement>(null);

  // Subtle breathing idle animation on the gold seal while curtains are closed
  useEffect(() => {
    if (reducedMotion || !sealRef.current) return;
    const tween = gsap.to(sealRef.current, {
      scale: 1.03,
      duration: 3.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, [reducedMotion]);

  // Opening dynamics:
  // 1. Fabric horizontal compression (accordion gathering towards the wall)
  // When closed: scaleX = 1.0. When fully opened: gathered into dense 18% bunch against wall.
  const scaleX = 1 - curtainOpen * 0.82;

  // 2. Linear pull travel: the inner edge pulls all the way off-screen with slight over-travel
  const panelTranslateX = curtainOpen * 32; // percentage shift outwards

  // 3. Dynamic fold shadow density: as fabric bunches up, valleys get deeper and darker
  const foldShadowIntensity = 0.55 + curtainOpen * 0.45;

  // 4. Center seam rim light & back-spill: as curtains part, light from the showroom
  // pours forward through the opening gap, creating a high-contrast theatrical rim glow.
  const lightSpillOpacity = Math.min(1, Math.max(0, curtainOpen * 1.8));
  const lightSpillWidth = Math.min(100, curtainOpen * 140);

  // 5. Center seal dissolving
  const sealOpacity = Math.max(0, 1 - curtainOpen * 2.2);
  const sealScale = 1 + curtainOpen * 0.15;
  const sealBlur = curtainOpen * 10;

  // 6. Sliding brass rings at the top
  const rings = useMemo(() => {
    return Array.from({ length: FLUTE_COUNT }, (_, i) => ({
      id: `ring-${i + 1}`,
      basePos: (i + 0.6) / FLUTE_COUNT,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* SVG Filters & Definitions for Realistic Silk & Gold Bullion */}
      <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
        <defs>
          {/* Silk Micro-Fiber Weave Texture */}
          <filter id="silk-texture" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75 0.08"
              numOctaves="3"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.15
                      0 0 0 0 0.12
                      0 0 0 0 0.10
                      0 0 0 0.09 0"
              result="tintedNoise"
            />
            <feBlend mode="multiply" in="SourceGraphic" in2="tintedNoise" />
          </filter>

          {/* Realistic Gold Bullion Metallic Gradient */}
          <linearGradient id="gold-bullion" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff8e7" />
            <stop offset="20%" stopColor="#dfc18b" />
            <stop offset="45%" stopColor="#9b7a42" />
            <stop offset="70%" stopColor="#e5cb9b" />
            <stop offset="88%" stopColor="#876631" />
            <stop offset="100%" stopColor="#f3deb5" />
          </linearGradient>

          {/* Vertical Silk Flute Shading Ramp (Left Panel: light catches from top-right) */}
          <linearGradient id="left-silk-wave" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#050302" />
            <stop offset="15%" stopColor="#120e0b" />
            <stop offset="38%" stopColor="#2c221a" />
            <stop offset="48%" stopColor="#45362a" />
            <stop offset="54%" stopColor="#2e241c" />
            <stop offset="72%" stopColor="#15100c" />
            <stop offset="100%" stopColor="#060403" />
          </linearGradient>

          {/* Vertical Silk Flute Shading Ramp (Right Panel: light catches from top-left) */}
          <linearGradient id="right-silk-wave" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#060403" />
            <stop offset="28%" stopColor="#15100c" />
            <stop offset="46%" stopColor="#2e241c" />
            <stop offset="52%" stopColor="#45362a" />
            <stop offset="62%" stopColor="#2c221a" />
            <stop offset="85%" stopColor="#120e0b" />
            <stop offset="100%" stopColor="#050302" />
          </linearGradient>

          {/* Architectural Gold Embroidery Pattern (Greek-key guilloche repeat) */}
          <pattern id="gold-embroidery-pattern" width="28" height="28" patternUnits="userSpaceOnUse">
            <rect width="28" height="28" fill="none" />
            {/* Outer border piping */}
            <line x1="2" y1="0" x2="2" y2="28" stroke="url(#gold-bullion)" strokeWidth="1.2" />
            <line x1="26" y1="0" x2="26" y2="28" stroke="url(#gold-bullion)" strokeWidth="1.2" />
            {/* Interlocking geometric fretwork */}
            <path
              d="M 6 0 L 6 10 L 16 10 L 16 18 L 10 18 L 10 14 L 14 14"
              fill="none"
              stroke="url(#gold-bullion)"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
            <path
              d="M 22 28 L 22 18 L 12 18 L 12 10 L 18 10 L 18 14 L 14 14"
              fill="none"
              stroke="url(#gold-bullion)"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
            {/* Diamond stitch accents */}
            <polygon points="14,3 17,6 14,9 11,6" fill="url(#gold-bullion)" opacity="0.85" />
            <polygon points="14,19 17,22 14,25 11,22" fill="url(#gold-bullion)" opacity="0.85" />
          </pattern>
        </defs>
      </svg>

      {/* ──────────────────────────────────────────────────────────
          ACT 1 & 2: THEATRICAL DIRECTIONAL SPOTLIGHTS
          Two grand overhead spotlights casting warm champagne chiaroscuro cones
      ────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Left Spotlight Cone */}
        <div
          className="absolute -top-[10%] left-[12%] w-[45vw] h-[120vh] origin-top -rotate-[16deg] pointer-events-none"
          style={{
            background:
              'conic-gradient(from 170deg at 50% 0%, transparent 0deg, rgba(235, 208, 158, 0.16) 18deg, rgba(184, 155, 106, 0.08) 28deg, transparent 38deg)',
            filter: 'blur(35px)',
          }}
        />

        {/* Right Spotlight Cone */}
        <div
          className="absolute -top-[10%] right-[12%] w-[45vw] h-[120vh] origin-top rotate-[16deg] pointer-events-none"
          style={{
            background:
              'conic-gradient(from 152deg at 50% 0%, transparent 0deg, rgba(184, 155, 106, 0.08) 10deg, rgba(235, 208, 158, 0.16) 20deg, transparent 38deg)',
            filter: 'blur(35px)',
          }}
        />

        {/* Floating atmospheric gold dust particles in spotlight beam */}
        {!reducedMotion && (
          <div className="absolute inset-0 opacity-40">
            <div
              className="absolute top-[20%] left-[28%] w-1.5 h-1.5 rounded-full bg-[#f4e2c0] animate-pulse"
              style={{ animationDuration: '4s', filter: 'blur(0.5px)' }}
            />
            <div
              className="absolute top-[35%] left-[22%] w-1 h-1 rounded-full bg-[#d4b784] animate-ping"
              style={{ animationDuration: '6s', filter: 'blur(0.5px)' }}
            />
            <div
              className="absolute top-[28%] right-[25%] w-1.5 h-1.5 rounded-full bg-[#f4e2c0] animate-pulse"
              style={{ animationDuration: '4.8s', filter: 'blur(0.5px)' }}
            />
            <div
              className="absolute top-[48%] right-[32%] w-1 h-1 rounded-full bg-[#b89b6a] animate-ping"
              style={{ animationDuration: '7s', filter: 'blur(0.5px)' }}
            />
          </div>
        )}

        {/* Floor Light Pool where spotlights kiss the bottom hem */}
        <div
          className="absolute bottom-0 inset-x-[15%] h-36 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(220, 190, 140, 0.22) 0%, rgba(184, 155, 106, 0.08) 45%, transparent 75%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Dynamic Center Light Spill: Showroom glow piercing through parted seam */}
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none will-change-transform"
          style={{
            width: `${lightSpillWidth}vw`,
            opacity: lightSpillOpacity,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255, 246, 230, 0.45) 0%, rgba(220, 185, 130, 0.22) 40%, transparent 75%)',
            filter: 'blur(28px)',
          }}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────
          ARCHITECTURAL BRASS ROD & SLIDING RINGS
          Heavily machined champagne-bronze hanging track
      ────────────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-0 h-10 z-30 pointer-events-none">
        {/* Rod Tube */}
        <div
          className="absolute inset-x-0 top-3 h-3 shadow-2xl"
          style={{
            background:
              'linear-gradient(180deg, #fff3dc 0%, #d8bb88 22%, #a8884e 48%, #574220 85%, #2a1f0d 100%)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255,255,255,0.7)',
          }}
        />

        {/* Left End Finial */}
        <div
          className="absolute left-0 top-1.5 w-6 h-6 rounded-r-md border-r border-[#ffe8be]"
          style={{
            background: 'linear-gradient(135deg, #fcedcb 0%, #b89b6a 50%, #4a3818 100%)',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.7)',
          }}
        />

        {/* Right End Finial */}
        <div
          className="absolute right-0 top-1.5 w-6 h-6 rounded-l-md border-l border-[#ffe8be]"
          style={{
            background: 'linear-gradient(225deg, #fcedcb 0%, #b89b6a 50%, #4a3818 100%)',
            boxShadow: '-2px 2px 8px rgba(0,0,0,0.7)',
          }}
        />

        {/* Left Curtain Rings (Slide and bunch towards left wall on open) */}
        <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden pointer-events-none">
          {rings.map((ring) => {
            // As curtain gathers, rings compress towards the left anchor
            const currentPos = ring.basePos * scaleX - (panelTranslateX * 0.005);
            const leftPercent = Math.max(2, Math.min(98, currentPos * 100));
            return (
              <div
                key={`left-${ring.id}`}
                className="absolute top-2 w-3.5 h-6 rounded-full border-2 border-[#e6cca0] -translate-x-1/2 will-change-transform shadow-md"
                style={{
                  left: `${leftPercent}%`,
                  background:
                    'linear-gradient(180deg, rgba(255,245,225,0.9) 0%, rgba(184,155,106,0.3) 50%, rgba(60,45,20,0.9) 100%)',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
                }}
              />
            );
          })}
        </div>

        {/* Right Curtain Rings (Slide and bunch towards right wall on open) */}
        <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden pointer-events-none">
          {rings.map((ring) => {
            // As curtain gathers, rings compress towards the right anchor
            const currentPos = ring.basePos * scaleX - (panelTranslateX * 0.005);
            const rightPercent = Math.max(2, Math.min(98, currentPos * 100));
            return (
              <div
                key={`right-${ring.id}`}
                className="absolute top-2 w-3.5 h-6 rounded-full border-2 border-[#e6cca0] translate-x-1/2 will-change-transform shadow-md"
                style={{
                  right: `${rightPercent}%`,
                  background:
                    'linear-gradient(180deg, rgba(255,245,225,0.9) 0%, rgba(184,155,106,0.3) 50%, rgba(60,45,20,0.9) 100%)',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          LEFT DRAPERY PANEL (ACCORDION GATHERING TO LEFT WALL)
      ────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 origin-left will-change-transform"
        style={{
          transform: `translateX(-${panelTranslateX}%) scaleX(${scaleX})`,
          filter: 'drop-shadow(12px 0 35px rgba(0, 0, 0, 0.85))',
        }}
      >
        {/* Base Obsidian Silk Flutes */}
        <div className="absolute inset-0 flex flex-row">
          {FLUTE_ITEMS.map((flute) => {
            // Depth modulation across flutes: inner flutes catch slightly more center light
            const innerRatio = flute.index / FLUTE_COUNT;
            const highlightBoost = 0.85 + innerRatio * 0.35;
            return (
              <div
                key={`left-${flute.id}`}
                className="relative h-full flex-1 overflow-hidden"
                style={{
                  background:
                    'linear-gradient(90deg, #050302 0%, #110d0a 16%, #281f18 36%, #423429 50%, #2a2019 64%, #120e0b 82%, #040302 100%)',
                }}
              >
                {/* Organic Silk Specular Ridge */}
                <div
                  className="absolute inset-y-0 left-[44%] w-[16%] pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(240, 220, 185, 0.18) 50%, transparent 100%)',
                    opacity: highlightBoost,
                  }}
                />

                {/* Vertical Ambient Shadow Valley */}
                <div
                  className="absolute inset-y-0 left-0 w-[18%] pointer-events-none bg-gradient-to-r from-black/85 via-black/40 to-transparent"
                  style={{ opacity: foldShadowIntensity }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-[18%] pointer-events-none bg-gradient-to-l from-black/85 via-black/40 to-transparent"
                  style={{ opacity: foldShadowIntensity }}
                />

                {/* Silk Micro-grain noise texture */}
                <div
                  className="absolute inset-0 opacity-[0.16] mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '4px 4px',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Global Drapery Depth Gradients:
            - Top gathering shadow under brass rod
            - Center soft velvet bloom
            - Bottom weighted floor contact shadow
        */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 8%, transparent 22%, transparent 75%, rgba(0,0,0,0.4) 90%, rgba(0,0,0,0.95) 100%)',
          }}
        />

        {/* Spotlight grazing wash from upper-right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 85% 15%, rgba(230, 200, 150, 0.16) 0%, transparent 65%)',
          }}
        />

        {/* ── METALLIC GOLD BULLION EMBROIDERY (LEADING INNER BORDER) ── */}
        <div
          className="absolute inset-y-0 right-0 w-8 sm:w-11 pointer-events-none z-10 overflow-hidden"
          style={{
            boxShadow: '-4px 0 16px rgba(0,0,0,0.8), 2px 0 8px rgba(0,0,0,0.9)',
            borderLeft: '1px solid rgba(225, 195, 140, 0.4)',
            borderRight: '1.5px solid rgba(255, 235, 185, 0.85)',
          }}
        >
          {/* Gold Bullion Base Fabric Trim */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #18120a 0%, #3a2b16 35%, #7a5e2f 50%, #46341a 75%, #1f160c 100%)',
            }}
          />

          {/* Stitched Gold Architectural Pattern */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <rect width="100%" height="100%" fill="url(#gold-embroidery-pattern)" />
          </svg>

          {/* Specular Shimmer along the gold thread edge */}
          <div
            className="absolute inset-y-0 right-[2px] w-[3px]"
            style={{
              background:
                'linear-gradient(180deg, #fff9ea 0%, #dfc08a 25%, #94723a 50%, #f7e6c4 75%, #82612b 100%)',
              boxShadow: '0 0 12px 1px rgba(245, 215, 150, 0.6)',
            }}
          />
        </div>

        {/* Dynamic Backlight Rim on parting:
            When opening, intense showroom light catches the leading inner edge
        */}
        <div
          className="absolute inset-y-0 right-0 w-14 pointer-events-none z-20 will-change-transform"
          style={{
            opacity: lightSpillOpacity,
            background:
              'linear-gradient(270deg, rgba(255, 245, 220, 0.75) 0%, rgba(220, 185, 125, 0.3) 40%, transparent 100%)',
          }}
        />

        {/* Bottom Weighted Scalloped Hem with Gold Piping */}
        <div
          className="absolute bottom-0 inset-x-0 h-4 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, #15100c 30%, #4a381d 75%, #a8874c 95%, #2a1f0e 100%)',
            borderBottom: '2px solid #dfc08a',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.95)',
          }}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────
          RIGHT DRAPERY PANEL (ACCORDION GATHERING TO RIGHT WALL)
      ────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 origin-right will-change-transform"
        style={{
          transform: `translateX(${panelTranslateX}%) scaleX(${scaleX})`,
          filter: 'drop-shadow(-12px 0 35px rgba(0, 0, 0, 0.85))',
        }}
      >
        {/* Base Obsidian Silk Flutes */}
        <div className="absolute inset-0 flex flex-row">
          {FLUTE_ITEMS.map((flute) => {
            // Symmetrical depth modulation: inner flutes catch slightly more center light
            const innerRatio = (FLUTE_COUNT - 1 - flute.index) / FLUTE_COUNT;
            const highlightBoost = 0.85 + innerRatio * 0.35;
            return (
              <div
                key={`right-${flute.id}`}
                className="relative h-full flex-1 overflow-hidden"
                style={{
                  background:
                    'linear-gradient(90deg, #040302 0%, #120e0b 18%, #2a2019 36%, #423429 50%, #281f18 64%, #110d0a 84%, #050302 100%)',
                }}
              >
                {/* Organic Silk Specular Ridge */}
                <div
                  className="absolute inset-y-0 left-[44%] w-[16%] pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(240, 220, 185, 0.18) 50%, transparent 100%)',
                    opacity: highlightBoost,
                  }}
                />

                {/* Vertical Ambient Shadow Valley */}
                <div
                  className="absolute inset-y-0 left-0 w-[18%] pointer-events-none bg-gradient-to-r from-black/85 via-black/40 to-transparent"
                  style={{ opacity: foldShadowIntensity }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-[18%] pointer-events-none bg-gradient-to-l from-black/85 via-black/40 to-transparent"
                  style={{ opacity: foldShadowIntensity }}
                />

                {/* Silk Micro-grain noise texture */}
                <div
                  className="absolute inset-0 opacity-[0.16] mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '4px 4px',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Global Drapery Depth Gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 8%, transparent 22%, transparent 75%, rgba(0,0,0,0.4) 90%, rgba(0,0,0,0.95) 100%)',
          }}
        />

        {/* Spotlight grazing wash from upper-left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 15% 15%, rgba(230, 200, 150, 0.16) 0%, transparent 65%)',
          }}
        />

        {/* ── METALLIC GOLD BULLION EMBROIDERY (LEADING INNER BORDER) ── */}
        <div
          className="absolute inset-y-0 left-0 w-8 sm:w-11 pointer-events-none z-10 overflow-hidden"
          style={{
            boxShadow: '4px 0 16px rgba(0,0,0,0.8), -2px 0 8px rgba(0,0,0,0.9)',
            borderRight: '1px solid rgba(225, 195, 140, 0.4)',
            borderLeft: '1.5px solid rgba(255, 235, 185, 0.85)',
          }}
        >
          {/* Gold Bullion Base Fabric Trim */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #1f160c 0%, #46341a 25%, #7a5e2f 50%, #3a2b16 65%, #18120a 100%)',
            }}
          />

          {/* Stitched Gold Architectural Pattern */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <rect width="100%" height="100%" fill="url(#gold-embroidery-pattern)" />
          </svg>

          {/* Specular Shimmer along the gold thread edge */}
          <div
            className="absolute inset-y-0 left-[2px] w-[3px]"
            style={{
              background:
                'linear-gradient(180deg, #fff9ea 0%, #dfc08a 25%, #94723a 50%, #f7e6c4 75%, #82612b 100%)',
              boxShadow: '0 0 12px 1px rgba(245, 215, 150, 0.6)',
            }}
          />
        </div>

        {/* Dynamic Backlight Rim on parting */}
        <div
          className="absolute inset-y-0 left-0 w-14 pointer-events-none z-20 will-change-transform"
          style={{
            opacity: lightSpillOpacity,
            background:
              'linear-gradient(90deg, rgba(255, 245, 220, 0.75) 0%, rgba(220, 185, 125, 0.3) 40%, transparent 100%)',
          }}
        />

        {/* Bottom Weighted Scalloped Hem with Gold Piping */}
        <div
          className="absolute bottom-0 inset-x-0 h-4 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, #15100c 30%, #4a381d 75%, #a8874c 95%, #2a1f0e 100%)',
            borderBottom: '2px solid #dfc08a',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.95)',
          }}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────
          ACT 1: STITCHED GOLD BRAND SEAL & MEDALLION
          Suspended on braided gold cord over closed center seam
      ────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-30 will-change-transform"
        style={{
          opacity: sealOpacity,
          transform: `scale(${sealScale})`,
          filter: `blur(${sealBlur}px)`,
        }}
      >
        {/* Suspended Braided Gold Cord */}
        <div
          className="w-[2.5px] h-20 mb-[-6px]"
          style={{
            background:
              'repeating-linear-gradient(45deg, #dfc08a 0px, #dfc08a 3px, #82612b 4px, #82612b 7px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        />

        {/* Dimensional Gold Wax Seal Medallion */}
        <div
          ref={sealRef}
          className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full mb-6 p-1"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #fff7e6 0%, #d8bb85 25%, #927038 55%, #4e3818 85%, #291c0b 100%)',
            boxShadow:
              '0 14px 40px 4px rgba(0, 0, 0, 0.85), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -3px 6px rgba(0, 0, 0, 0.7)',
            border: '2px solid #fce8c3',
          }}
        >
          {/* Inner Knurled Beaded Ring */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center border border-[#866531] p-3"
            style={{
              background:
                'radial-gradient(circle at 40% 35%, #5a421e 0%, #2f210d 60%, #170f05 100%)',
              boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.8)',
            }}
          >
            <LogoMark className="w-8 h-10 sm:w-10 sm:h-12 text-[#f9ebce] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </div>
        </div>

        {/* Brand Typographic Wordmark */}
        <span className="text-3xl sm:text-5xl md:text-6xl font-serif font-light tracking-[0.22em] uppercase text-[#fdfaf5] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
          Urban Essentials
        </span>

        {/* Sub-label */}
        <span className="mt-4 text-[10px] sm:text-xs uppercase tracking-[0.4em] font-medium text-[#dfc08a] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          The Flagship Showroom
        </span>
      </div>
    </div>
  );
}
