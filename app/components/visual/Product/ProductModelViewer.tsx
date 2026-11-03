import React, { useEffect, useRef, useState } from 'react';

interface ProductModelViewerProps {
  src: string;
  poster?: string;
  alt?: string;
  className?: string;
  autoRotate?: boolean;
}

export function ProductModelViewer({
  src,
  poster,
  alt = '3D Product Model',
  className = '',
  autoRotate = true,
}: ProductModelViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [isInteracted, setIsInteracted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (customElements.get('model-viewer')) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'local-model-viewer-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'module';
      script.src = '/scripts/model-viewer.min.js';
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setIsLoaded(true));
      if (customElements.get('model-viewer')) {
        setIsLoaded(true);
      }
    }
  }, []);

  // React doesn't map `onLoad`/`onError` props onto a custom element's native
  // `load`/`error` events, so bind them directly once the element exists.
  useEffect(() => {
    const el = modelRef.current;
    if (!isLoaded || !el) return;
    const onReady = () => setIsModelReady(true);
    const onError = () => setHasError(true);
    el.addEventListener('load', onReady);
    el.addEventListener('error', onError);
    if ((el as any).loaded) setIsModelReady(true);
    return () => {
      el.removeEventListener('load', onReady);
      el.removeEventListener('error', onError);
    };
  }, [isLoaded, src]);

  const handleResetCamera = () => {
    if (!modelRef.current) return;
    try {
      (modelRef.current as any).cameraOrbit = 'auto auto auto';
      (modelRef.current as any).cameraTarget = 'auto auto auto';
      (modelRef.current as any).resetTurntable?.();
    } catch {
      // Ignore
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] bg-gradient-to-b from-[#f8f5ee] to-[#e8e1d4] rounded-3xl overflow-hidden flex items-center justify-center select-none ${className}`}
    >
      {isLoaded ? (
        React.createElement(
          'model-viewer',
          {
            ref: modelRef,
            src,
            poster,
            alt,
            'camera-controls': true,
            'touch-action': 'pan-y',
            'auto-rotate': isRotating ? true : undefined,
            'auto-rotate-delay': '800',
            'rotation-per-second': '20deg',
            'shadow-intensity': '1.5',
            'shadow-softness': '0.8',
            bounds: 'tight',
            'camera-orbit': '0deg 75deg auto',
            'min-camera-orbit': 'auto auto 50%',
            'max-camera-orbit': 'auto auto 200%',
            exposure: 1.1,
            ar: true,
            'ar-modes': 'webxr scene-viewer quick-look',
            loading: 'eager',
            reveal: 'auto',
            onPointerDown: () => setIsInteracted(true),
            onTouchStart: () => setIsInteracted(true),
            style: {
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              outline: 'none',
              cursor: 'grab',
            },
          },
          <button
            slot="ar-button"
            type="button"
            key="ar-btn"
            className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-[#241a16] text-[#f4f0e8] text-xs font-semibold tracking-wide shadow-lg hover:bg-[#3a2c24] active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#b89b6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>View in AR</span>
          </button>,
        )
      ) : null}

      {/* Instant fallback / Loading skeleton with poster image */}
      {(!isLoaded || !isModelReady) && !hasError && poster && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#e8e1d4]/60">
          <img
            src={poster}
            alt={alt}
            className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-[#241a16]/10 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#b89b6a] border-t-transparent animate-spin" />
            <span className="text-[11px] uppercase tracking-widest text-[#241a16] font-semibold bg-white/90 px-3 py-1 rounded-full shadow-sm">
              Rendering 3D Model...
            </span>
          </div>
        </div>
      )}

      {/* Floating 3D controls */}
      <div className="absolute top-[4.5rem] right-5 z-20 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setIsRotating((prev) => !prev)}
          title={isRotating ? 'Pause auto-rotation' : 'Start auto-rotation'}
          aria-label={isRotating ? 'Pause auto-rotation' : 'Start auto-rotation'}
          className={`w-9 h-9 rounded-full backdrop-blur-md border shadow-sm flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isRotating ? 'bg-[#241a16] text-[#f4f0e8] border-[#241a16]' : 'bg-white/90 hover:bg-white text-[#241a16] border-[#c9c2b8]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          title="Reset camera view"
          aria-label="Reset camera view"
          className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#241a16] border border-[#c9c2b8] backdrop-blur-md shadow-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      </div>

      {/* Interactive Drag Hint (disappears on first interaction) */}
      {!isInteracted && isModelReady && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#241a16]/85 text-[#f4f0e8] text-[11px] font-medium backdrop-blur-md shadow-md">
          <svg className="w-3.5 h-3.5 text-[#b89b6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span>Drag 360° to rotate</span>
        </div>
      )}
    </div>
  );
}
