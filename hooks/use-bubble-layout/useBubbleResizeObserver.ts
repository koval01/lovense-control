import { useEffect, type MutableRefObject } from 'react';
import type { BubblePosition } from '@/lib/lovense-domain';
import { DEFAULT_CONTAINER_HEIGHT } from './constants';
import { clampBubblePosition, distributedBubbleX } from './geometry';

type Params = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  features: { id: string }[];
  bubbleSize: number;
  bottomInset: number;
  horizontalInset: number;
  setBubblePositions: React.Dispatch<React.SetStateAction<Record<string, BubblePosition>>>;
  containerWRef: MutableRefObject<number>;
  containerHRef: MutableRefObject<number>;
  restYRef: MutableRefObject<number>;
  groupRestYRef: MutableRefObject<number>;
  prevWidthRef: MutableRefObject<number>;
};

export function useBubbleResizeObserver({
  containerRef,
  features,
  bubbleSize,
  bottomInset,
  horizontalInset,
  setBubblePositions,
  containerWRef,
  containerHRef,
  restYRef,
  groupRestYRef,
  prevWidthRef,
}: Params): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width || 400;
      const h = rect.height || DEFAULT_CONTAINER_HEIGHT;
      const widthChanged = Math.abs(prevWidthRef.current - w) > 1;
      prevWidthRef.current = w;

      containerWRef.current = w;
      containerHRef.current = h;
      restYRef.current = Math.max(h - bubbleSize - bottomInset, 0);
      groupRestYRef.current = Math.max(h - bubbleSize - bottomInset, 0);

      setBubblePositions((prev) => {
        if (features.length === 0) return prev;

        const next: Record<string, BubblePosition> = {};
        for (let i = 0; i < features.length; i += 1) {
          const id = features[i].id;
          const existing = prev[id];
          const fallback = {
            x: distributedBubbleX(i, features.length, w, bubbleSize, horizontalInset),
            y: restYRef.current,
          };
          const pos = existing ?? fallback;
          const newY = pos.y;
          const newX = widthChanged
            ? distributedBubbleX(i, features.length, w, bubbleSize, horizontalInset)
            : pos.x;
          next[id] = clampBubblePosition(newX, newY, w, h, bubbleSize, bottomInset);
        }
        return next;
      });
    };

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [
    containerRef,
    bubbleSize,
    bottomInset,
    horizontalInset,
    features,
    setBubblePositions,
    containerWRef,
    containerHRef,
    restYRef,
    groupRestYRef,
    prevWidthRef,
  ]);
}
