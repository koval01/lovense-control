/**
 * Manages bubble positions and fall animations for float-mode control.
 * Handles layout initialization, physics-style fall, and container resize tracking.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { BubblePosition, FeatureGroup } from '@/lib/lovense-domain';

const DEFAULT_BUBBLE_SIZE = 64;
const DEFAULT_CONTAINER_HEIGHT = 400;

/** Options for useBubbleLayout. */
export interface UseBubbleLayoutOptions {
  features: { id: string }[];
  groups: FeatureGroup[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  bubbleSize?: number;
  bottomInset?: number;
  horizontalInset?: number;
  onLevelChange: (featureId: string, percentage: number) => void;
  onGroupLevelChange: (group: FeatureGroup, percentage: number) => void;
  /** Called at release before sending stop; use to flush pending throttled commands for the bubble's toy(s). */
  onFlushBeforeStop?: (id: string, isGroup: boolean) => void;
}

/** Manages bubble positions and fall animations for float mode. */
export function useBubbleLayout(options: UseBubbleLayoutOptions) {
  const {
    features,
    groups,
    containerRef,
    bubbleSize = DEFAULT_BUBBLE_SIZE,
    bottomInset = 0,
    horizontalInset = 0,
    onLevelChange,
    onGroupLevelChange,
    onFlushBeforeStop,
  } = options;

  const [bubblePositions, setBubblePositions] = useState<Record<string, BubblePosition>>({});
  const fallingAnimations = useRef<Record<string, number>>({});
  const restYRef = useRef(DEFAULT_CONTAINER_HEIGHT - bubbleSize - bottomInset);
  const groupRestYRef = useRef(DEFAULT_CONTAINER_HEIGHT - bubbleSize - bottomInset);
  const containerWRef = useRef(400);
  const containerHRef = useRef(DEFAULT_CONTAINER_HEIGHT);
  const prevWidthRef = useRef(400);

  const clampPosition = useCallback((x: number, y: number) => {
    const maxX = Math.max(0, containerWRef.current - bubbleSize);
    const maxY = Math.max(0, containerHRef.current - bubbleSize - bottomInset);
    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    };
  }, [bubbleSize, bottomInset]);

  const getDistributedX = useCallback((index: number, total: number, width: number) => {
    const maxX = Math.max(0, width - bubbleSize);
    const centerPadding = Math.max(horizontalInset + bubbleSize * 0.35, 26);
    const startX = Math.min(centerPadding, maxX / 2);
    const endX = Math.max(startX, maxX - centerPadding);
    if (total <= 1) return maxX / 2;
    return startX + (index / (total - 1)) * (endX - startX);
  }, [bubbleSize, horizontalInset]);

  // Track container dimensions via ResizeObserver so positions stay correct after window resize
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
            x: getDistributedX(i, features.length, w),
            y: restYRef.current,
          };
          const pos = existing ?? fallback;
          // Keep current vertical position on resize to avoid visual "dropping"
          // when only container metrics change a bit.
          const newY = pos.y;
          const newX = widthChanged ? getDistributedX(i, features.length, w) : pos.x;
          next[id] = clampPosition(newX, newY);
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
  }, [containerRef, clampPosition, bubbleSize, bottomInset, getDistributedX, features]);

  // Initialize positions for newly added features
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

        if (
          !existing ||
          existing.x !== clamped.x ||
          existing.y !== clamped.y
        ) {
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [features, clampPosition, getDistributedX]);

  const startBubbleFall = useCallback(
    (id: string, startX: number, startY: number, _rectHeight: number, isGroup: boolean) => {
      const bottomY = isGroup ? groupRestYRef.current : restYRef.current;
      const { x: clampedStartX, y: clampedStartY } = clampPosition(startX, startY);
      const duration = 300;
      const key = isGroup ? `group-${id}` : id;

      onFlushBeforeStop?.(id, isGroup);

      if (isGroup) {
        const group = groups.find((g) => g.id === id);
        if (group) onGroupLevelChange(group, 0);
      } else {
        onLevelChange(id, 0);
      }

      if (fallingAnimations.current[key]) {
        cancelAnimationFrame(fallingAnimations.current[key]);
      }

      // Immediately sync state with the visual release position so motion values stay in sync
      const startPos = { x: clampedStartX, y: clampedStartY };
      if (isGroup) {
        const group = groups.find((g) => g.id === id);
        if (group) {
          const anchorId = group.featureIds[0];
          setBubblePositions((prev) => ({ ...prev, [anchorId]: startPos }));
        }
      } else {
        setBubblePositions((prev) => ({ ...prev, [id]: startPos }));
      }

      const startTime = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - (1 - t) * (1 - t);
        const currentY = clampedStartY + (bottomY - clampedStartY) * eased;

        const { x: cx, y: cy } = clampPosition(clampedStartX, currentY);
        if (isGroup) {
          const group = groups.find((g) => g.id === id);
          if (!group) {
            delete fallingAnimations.current[key];
            return;
          }
          const anchorId = group.featureIds[0];
          setBubblePositions((prev) => ({
            ...prev,
            [anchorId]: { x: cx, y: cy },
          }));
        } else {
          setBubblePositions((prev) => ({
            ...prev,
            [id]: { x: cx, y: cy },
          }));
        }

        if (t < 1) {
          fallingAnimations.current[key] = requestAnimationFrame(step);
        } else {
          const { x: finalX, y: finalY } = clampPosition(clampedStartX, bottomY);
          if (isGroup) {
            const group = groups.find((g) => g.id === id);
            if (group) {
              const anchorId = group.featureIds[0];
              setBubblePositions((prev) => ({
                ...prev,
                [anchorId]: { x: finalX, y: finalY },
              }));
            }
          } else {
            setBubblePositions((prev) => ({
              ...prev,
              [id]: { x: finalX, y: finalY },
            }));
          }
          delete fallingAnimations.current[key];
        }
      };

      fallingAnimations.current[key] = requestAnimationFrame(step);
    },
    [groups, onLevelChange, onGroupLevelChange, onFlushBeforeStop, clampPosition]
  );

  useEffect(() => {
    return () => {
      Object.values(fallingAnimations.current).forEach((rafId) => {
        cancelAnimationFrame(rafId);
      });
      fallingAnimations.current = {};
    };
  }, []);

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
  }, [features, clampPosition, getDistributedX]);

  const setBubblePosition = useCallback(
    (id: string, x: number, y: number) => {
      const clamped = clampPosition(x, y);
      setBubblePositions((prev) => ({ ...prev, [id]: clamped }));
    },
    [clampPosition]
  );

  return {
    bubblePositions,
    setBubblePositions,
    setBubblePosition,
    startBubbleFall,
    restYRef,
    groupRestYRef,
    resetBubblePositions,
    BUBBLE_SIZE: bubbleSize,
  };
}
