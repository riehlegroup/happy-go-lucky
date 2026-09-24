import { useEffect, useRef, useState } from "react";

interface DelayedLoadingOptions {
  delay?: number;       // e.g. 200ms
  minDuration?: number; // e.g. 400ms
}

export const useDelayedLoading = (
  isLoading: boolean,
  { delay = 200, minDuration = 400 }: DelayedLoadingOptions = {}
) => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    let minTimer: NodeJS.Timeout;

    if (isLoading) {
      // wait before showing the skeleton
      delayTimer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setShowSkeleton(true);
      }, delay);
    } else {
      // request is complete, check if the skeleton was shown and if it was shown for at least minDuration
      if (shownAtRef.current !== null) {
        const visibleTime = Date.now() - shownAtRef.current;
        const remaining = minDuration - visibleTime;

        if (remaining > 0) {
          // Mindestdauer einhalten
          minTimer = setTimeout(() => {
            setShowSkeleton(false);
            shownAtRef.current = null;
          }, remaining);
        } else {
          setShowSkeleton(false);
          shownAtRef.current = null;
        }
      } else {
        // request completed before the skeleton was shown, no need to show it
        setShowSkeleton(false);
      }
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(minTimer);
    };
  }, [isLoading, delay, minDuration]);

  return showSkeleton;
};