import { useCallback, useEffect, useRef, useState } from 'react';

export type AddToCartState = 'idle' | 'adding' | 'added';

interface UseAddToCartFeedbackOptions {
  /** How long to show the "adding" state before `onAdd` fires. Defaults to 0 (fires immediately). */
  addingDurationMs?: number;
  /** How long to show the "added" state before resetting to idle. */
  addedDurationMs?: number;
}

/**
 * Drives the idle -> adding -> added -> idle button state machine shared by
 * every "add to cart" control in the showcase, and clears its timeouts on
 * unmount so a card removed mid-animation can't call setState after the fact.
 */
export function useAddToCartFeedback(
  onAdd: () => void,
  { addingDurationMs = 0, addedDurationMs = 2200 }: UseAddToCartFeedbackOptions = {},
) {
  const [state, setState] = useState<AddToCartState>('idle');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  const isLockedRef = useRef(false);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const trigger = useCallback(() => {
    // Strictly prevent duplicate execution from double clicks, rapid taps, or event bubbling
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    if (addingDurationMs > 0) {
      setState('adding');
      const addingTimeout = setTimeout(() => {
        try {
          onAddRef.current();
        } catch (e) {
          console.error('[AddToCart] Error executing onAdd:', e);
        }
        setState('added');
      }, addingDurationMs);
      timeoutsRef.current.push(addingTimeout);
    } else {
      // Execute onAdd immediately and synchronously
      try {
        onAddRef.current();
      } catch (e) {
        console.error('[AddToCart] Error executing onAdd:', e);
      }
      setState('added');
    }

    const addedTimeout = setTimeout(() => {
      setState('idle');
      isLockedRef.current = false;
    }, addedDurationMs);
    timeoutsRef.current.push(addedTimeout);
  }, [addingDurationMs, addedDurationMs]);

  return { state, trigger };
}
