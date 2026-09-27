import { useState, useEffect, useRef } from 'react';

interface UseEdgeSwipeBackOptions {
  onBack: () => void;
  enabled?: boolean;
  edgeThreshold?: number; // px from left edge to activate (default: 40)
  swipeDistanceThreshold?: number; // px required to trigger back (default: 70)
}

export function useEdgeSwipeBack({
  onBack,
  enabled = true,
  edgeThreshold = 45,
  swipeDistanceThreshold = 75,
}: UseEdgeSwipeBackOptions) {
  const [swipeProgress, setSwipeProgress] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isEligibleRef = useRef<boolean>(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // Check if starting near the left edge
      if (touch.clientX <= edgeThreshold) {
        // Ignore if touching an input, slider or element marked no-swipe
        const target = e.target as HTMLElement | null;
        if (target) {
          if (
            target.closest('input, textarea, select, [data-no-swipe], .touch-none') ||
            target.getAttribute('role') === 'slider'
          ) {
            return;
          }
        }

        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
        isEligibleRef.current = true;
      } else {
        isEligibleRef.current = false;
        touchStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEligibleRef.current || !touchStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // If user is scrolling vertically more than swiping horizontally, cancel
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 15) {
        isEligibleRef.current = false;
        setIsSwiping(false);
        setSwipeProgress(0);
        return;
      }

      if (deltaX > 10) {
        setIsSwiping(true);
        const progress = Math.min(1, Math.max(0, (deltaX - 10) / swipeDistanceThreshold));
        setSwipeProgress(progress);
      } else {
        setSwipeProgress(0);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEligibleRef.current || !touchStartRef.current) {
        setIsSwiping(false);
        setSwipeProgress(0);
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      const velocity = deltaX / Math.max(1, elapsed);

      // Trigger if distance threshold reached or fast swipe flick
      if (
        (deltaX >= swipeDistanceThreshold || (deltaX > 40 && velocity > 0.4)) &&
        Math.abs(deltaY) < 80
      ) {
        onBackRef.current();
      }

      isEligibleRef.current = false;
      touchStartRef.current = null;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    const handleTouchCancel = () => {
      isEligibleRef.current = false;
      touchStartRef.current = null;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, edgeThreshold, swipeDistanceThreshold]);

  return { isSwiping, swipeProgress };
}
