'use client';

import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
/** Small threshold to avoid flaky detection when dimensions are nearly equal */
const ASPECT_THRESHOLD = 20;

/**
 * Returns true when the device is in landscape on a mobile viewport.
 * Uses window dimensions (more reliable than CSS orientation on mobile)
 * with Screen Orientation API as fallback when available.
 */
export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const check = () => {
      const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT;
      if (!isMobileViewport) {
        setIsLandscape(false);
        return;
      }

      // Use Screen Orientation API when available (most reliable on mobile)
      const orientation = window.screen?.orientation;
      if (orientation?.type) {
        const type = orientation.type;
        const landscape =
          type === 'landscape-primary' || type === 'landscape-secondary';
        setIsLandscape(landscape);
        return;
      }

      // Fallback: width > height = landscape (with threshold to avoid edge cases)
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsLandscape(width > height + ASPECT_THRESHOLD);
    };

    check();

    window.addEventListener('resize', check);
    window.screen?.orientation?.addEventListener?.('change', check);

    return () => {
      window.removeEventListener('resize', check);
      window.screen?.orientation?.removeEventListener?.('change', check);
    };
  }, []);

  return isLandscape;
}
