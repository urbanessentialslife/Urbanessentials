import { useEffect, useRef, useState, type RefObject } from 'react';
import { gsap } from 'gsap';

interface UseDialogTransitionOptions {
  /** GSAP "from" vars for the entrance animation (e.g. { opacity: 0, scale: 0.92, y: 40 }). */
  enterFrom: gsap.TweenVars;
  /** GSAP "to" vars for the exit animation; defaults to reversing `enterFrom`. */
  exitTo?: gsap.TweenVars;
  duration?: number;
  ease?: string;
  /**
   * Whether the dialog is currently open. Pass `true` for a dialog that only
   * ever mounts while open (it naturally re-mounts fresh each time). Pass the
   * real open/closed flag for a dialog that manages its own visibility
   * internally (e.g. via an early `return null`) and never actually
   * unmounts — otherwise the entrance animation and the close guard below
   * would only ever fire once, on the component's first-ever mount.
   */
  isOpen: boolean;
}

/**
 * Drives a mount/unmount-with-animation dialog: plays a GSAP entrance tween
 * whenever it opens, and — instead of letting the caller unmount the panel
 * instantly — plays an exit tween first and only calls the real `onClose`
 * once it finishes, so closing reads as a motion, not a cut.
 */
export function useDialogTransition(
  rootRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  { enterFrom, exitTo, duration = 0.45, ease = 'power3.out', isOpen }: UseDialogTransitionOptions,
) {
  const [isClosing, setIsClosing] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !rootRef.current) return;

    closingRef.current = false;
    setIsClosing(false);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(rootRef.current, enterFrom, {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        duration,
        ease,
      });
    }, rootRef as RefObject<HTMLElement>);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!rootRef.current || prefersReducedMotion) {
      onClose();
      return;
    }

    setIsClosing(true);
    gsap.to(rootRef.current, {
      ...(exitTo ?? enterFrom),
      duration: duration * 0.8,
      ease: 'power2.in',
      onComplete: onClose,
    });
  };

  return { handleClose, isClosing };
}
