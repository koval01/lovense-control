import { useCallback } from 'react';
import { clampBubblePosition } from './geometry';
import { resolveFallGroup, setFallBubblePos } from './bubble-fall-writes';
import type { StartBubbleFallParams } from './start-bubble-fall-params';

export function useStartBubbleFall({
  groups,
  bubbleSize,
  bottomInset,
  onLevelChange,
  onGroupLevelChange,
  onFlushBeforeStop,
  fallingAnimations,
  setBubblePositions,
  restYRef,
  groupRestYRef,
  containerWRef,
  containerHRef,
}: StartBubbleFallParams) {
  return useCallback(
    (id: string, startX: number, startY: number, _rectHeight: number, isGroup: boolean) => {
      const bottomY = isGroup ? groupRestYRef.current : restYRef.current;
      const w = containerWRef.current;
      const h = containerHRef.current;
      const clamp = (x: number, y: number) => clampBubblePosition(x, y, w, h, bubbleSize, bottomInset);
      const { x: sx, y: sy } = clamp(startX, startY);
      const duration = 300;
      const key = isGroup ? `group-${id}` : id;

      onFlushBeforeStop?.(id, isGroup);

      if (isGroup) {
        const grp = resolveFallGroup(groups, id, true);
        if (grp) onGroupLevelChange(grp, 0);
      } else {
        onLevelChange(id, 0);
      }

      if (fallingAnimations.current[key]) {
        cancelAnimationFrame(fallingAnimations.current[key]);
      }

      setFallBubblePos(setBubblePositions, groups, id, isGroup, { x: sx, y: sy });

      const startTime = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - (1 - t) * (1 - t);
        const currentY = sy + (bottomY - sy) * eased;
        const { x: cx, y: cy } = clamp(sx, currentY);

        const g = resolveFallGroup(groups, id, isGroup);
        if (isGroup && !g) {
          delete fallingAnimations.current[key];
          return;
        }

        setFallBubblePos(setBubblePositions, groups, id, isGroup, { x: cx, y: cy });

        if (t < 1) {
          fallingAnimations.current[key] = requestAnimationFrame(step);
        } else {
          const fin = clamp(sx, bottomY);
          setFallBubblePos(setBubblePositions, groups, id, isGroup, fin);
          delete fallingAnimations.current[key];
        }
      };

      fallingAnimations.current[key] = requestAnimationFrame(step);
    },
    [
      groups,
      onLevelChange,
      onGroupLevelChange,
      onFlushBeforeStop,
      bubbleSize,
      bottomInset,
      fallingAnimations,
      setBubblePositions,
      restYRef,
      groupRestYRef,
      containerWRef,
      containerHRef,
    ]
  );
}
