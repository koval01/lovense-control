import { useCallback } from 'react';
import type { BubblePosition } from '@/lib/lovense-domain';

type Params = {
  features: { id: string }[];
  clampPosition: (x: number, y: number) => BubblePosition;
  getDistributedX: (index: number, total: number, width: number) => number;
  containerWRef: React.MutableRefObject<number>;
  restYRef: React.MutableRefObject<number>;
  setBubblePositions: React.Dispatch<React.SetStateAction<Record<string, BubblePosition>>>;
};

export function useBubblePositionMutators({
  features,
  clampPosition,
  getDistributedX,
  containerWRef,
  restYRef,
  setBubblePositions,
}: Params) {
  const resetBubblePositions = useCallback(() => {
    setBubblePositions(() => {
      const next: Record<string, BubblePosition> = {};
      features.forEach((f, index) => {
        const raw = {
          x: getDistributedX(index, features.length, containerWRef.current),
          y: restYRef.current,
        };
        next[f.id] = clampPosition(raw.x, raw.y);
      });
      return next;
    });
  }, [features, clampPosition, getDistributedX, containerWRef, restYRef, setBubblePositions]);

  const setBubblePosition = useCallback(
    (id: string, x: number, y: number) => {
      const clamped = clampPosition(x, y);
      setBubblePositions((prev) => ({ ...prev, [id]: clamped }));
    },
    [clampPosition, setBubblePositions]
  );

  return { resetBubblePositions, setBubblePosition };
}
