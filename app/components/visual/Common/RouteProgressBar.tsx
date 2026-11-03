import { useEffect, useRef, useState } from 'react';
import { useNavigation } from 'react-router';

/**
 * A thin top-of-viewport bar that fills while a route is loading, so a
 * navigation always gives instant visual feedback even before the new
 * page's own content is ready — the perceived-speed half of "snappy",
 * independent of actual load time.
 */
export function RouteProgressBar() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== 'idle';
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (isLoading) {
      setVisible(true);
      setProgress(20);
      timeoutsRef.current.push(
        setTimeout(() => setProgress(50), 150),
        setTimeout(() => setProgress(75), 600),
        setTimeout(() => setProgress(88), 1500),
      );
      return;
    }

    setProgress(100);
    timeoutsRef.current.push(
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250),
    );
  }, [isLoading]);

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none"
      role="progressbar"
      aria-hidden="true"
    >
      <div
        className="h-full bg-[#b89b6a] shadow-[0_0_8px_rgba(184,155,106,0.6)] transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}
