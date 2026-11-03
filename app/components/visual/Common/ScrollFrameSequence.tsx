import React, { useEffect, useRef } from 'react';

interface ScrollFrameSequenceProps {
  /** Public path to the frame folder, e.g. "/frames/entrance". */
  basePath: string;
  frameCount: number;
  /** 0-1 playhead. A frame is picked by nearest index, no interpolation. */
  progress: number;
  className?: string;
}

/**
 * Scroll-scrubbed video, without a <video> element. Chrome (and every
 * other browser tested) coalesces rapid `video.currentTime` writes —
 * issuing 40 seeks 16ms apart during a fast scroll produced exactly one
 * `seeked` event, so the picture visibly lags and then jumps to catch up.
 * There is no bitrate or keyframe-density fix for that; it's the seek
 * pipeline itself being throttled.
 *
 * This draws a pre-extracted frame straight to a canvas instead — an
 * array index and a synchronous `drawImage`, the technique behind every
 * "scroll to explore the product" site that actually feels smooth. Frames
 * load in the background (frame 0 first, at high priority) and the
 * nearest already-loaded frame is drawn if the exact one isn't in yet, so
 * fast scrubbing during initial load never shows a blank canvas.
 */
export function ScrollFrameSequence({ basePath, frameCount, progress, className }: ScrollFrameSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const lastDrawnRef = useRef(-1);

  const draw = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    let img = imagesRef.current[index];
    if (!img) {
      for (let d = 1; d < frameCount; d++) {
        if (imagesRef.current[index - d]) {
          img = imagesRef.current[index - d];
          break;
        }
        if (imagesRef.current[index + d]) {
          img = imagesRef.current[index + d];
          break;
        }
      }
    }
    if (!img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = w / h;
    let sx: number, sy: number, sw: number, sh: number;
    if (imgRatio > canvasRatio) {
      sh = img.naturalHeight;
      sw = sh * canvasRatio;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    lastDrawnRef.current = index;
  };

  // Loading all 280 frames the instant this mounts (one `new Image()` per
  // frame, fired in a tight loop) used to mean 280 concurrent requests
  // stampeding out ahead of everything else on the page — main bundle,
  // fonts, the actual product imagery below the fold — which is a real
  // drag on perceived load speed for a canvas the visitor may not even
  // scroll through. Loading is staged instead: frame 0 first (so the
  // canvas has something to show immediately), then a sparse keyframe
  // pass once the browser is idle (making the whole scroll range coarsely
  // scrubbable fast), then the remaining in-between frames backfilled in
  // small throttled batches, each yielding back to the browser.
  useEffect(() => {
    imagesRef.current = new Array(frameCount).fill(null);
    lastDrawnRef.current = -1;
    let cancelled = false;

    const requestIdle = (cb: () => void) => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(cb, {timeout: 2000});
      } else {
        setTimeout(cb, 200);
      }
    };

    const loadFrame = (index: number, highPriority?: boolean) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.fetchPriority = highPriority ? 'high' : 'low';
        img.src = `${basePath}/frame-${String(index + 1).padStart(4, '0')}.webp`;
        img.onload = () => {
          if (!cancelled) {
            imagesRef.current[index] = img;
            if (index === 0) draw(0);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });

    const waitIdle = () => new Promise<void>((resolve) => requestIdle(resolve));

    async function run() {
      await loadFrame(0, true);
      if (cancelled) return;

      await waitIdle();
      if (cancelled) return;

      const keyStep = 8;
      const keyIndices: number[] = [];
      for (let i = keyStep; i < frameCount; i += keyStep) keyIndices.push(i);
      for (const i of keyIndices) {
        if (cancelled) return;
        await loadFrame(i);
      }

      const remaining: number[] = [];
      for (let i = 1; i < frameCount; i++) {
        if (i % keyStep !== 0) remaining.push(i);
      }

      const batchSize = 6;
      for (let b = 0; b < remaining.length; b += batchSize) {
        if (cancelled) return;
        await Promise.all(remaining.slice(b, b + batchSize).map((i) => loadFrame(i)));
        await waitIdle();
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, frameCount]);

  // Size the canvas backing store to its container (capped devicePixelRatio
  // so a 3x phone screen doesn't triple the pixels we're pushing), and
  // redraw on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(parent.clientWidth * dpr);
      const h = Math.round(parent.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        draw(lastDrawnRef.current >= 0 ? lastDrawnRef.current : 0);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const index = Math.min(frameCount - 1, Math.max(0, Math.round(progress * (frameCount - 1))));
    draw(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, frameCount]);

  return <canvas ref={canvasRef} className={className} />;
}
