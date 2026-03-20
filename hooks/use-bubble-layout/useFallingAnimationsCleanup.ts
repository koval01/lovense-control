import { useEffect, type MutableRefObject } from 'react';

export function useFallingAnimationsCleanup(fallingAnimations: MutableRefObject<Record<string, number>>): void {
  useEffect(() => {
    return () => {
      Object.values(fallingAnimations.current).forEach((rafId) => {
        cancelAnimationFrame(rafId);
      });
      fallingAnimations.current = {};
    };
  }, [fallingAnimations]);
}
