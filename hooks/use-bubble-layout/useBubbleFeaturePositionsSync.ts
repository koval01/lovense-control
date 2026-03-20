import { useEffect } from 'react';
import type { BubblePosition } from '@/lib/lovense-domain';

type Params = {
  features: { id: string }[];
  clampPosition: (x: number, y: number) => BubblePosition;
  getDistributedX: (index: number, total: number, width: number) => number;
  containerWRef: React.MutableRefObject<number>;
  restYRef: React.MutableRefObject<number>;
  setBubblePositions: React.Dispatch<React.SetStateAction<Record<string, BubblePosition>>>;
};

export function useBubbleFeaturePositionsSync({
  features,
  clampPosition,
  getDistributedX,
  containerWRef,
  restYRef,
  setBubblePositions,
}: Params): void {
  useEffect(() => {
    setBubblePositions((prev) => {
      const next: Record<string, BubblePosition> = {};
      let changed = Object.keys(prev).length !== features.length;

      features.forEach((f, index) => {
        const existing = prev[f.id];
        const fallback = {
          x: getDistributedX(index, features.length, containerWRef.current),
          y: restYRef.current,
        };
        const base = existing ?? fallback;
        const clamped = clampPosition(base.x, base.y);
        next[f.id] = clamped;

        if (!existing || existing.x !== clamped.x || existing.y !== clamped.y) {
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [features, clampPosition, getDistributedX, containerWRef, restYRef, setBubblePositions]);
}
