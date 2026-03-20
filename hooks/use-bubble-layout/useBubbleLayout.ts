import { useState, useRef, useCallback } from 'react';
import type { BubblePosition } from '@/lib/lovense-domain';
import { DEFAULT_BUBBLE_SIZE, DEFAULT_CONTAINER_HEIGHT } from './constants';
import type { UseBubbleLayoutOptions } from './types';
import { clampBubblePosition, distributedBubbleX } from './geometry';
import { useBubbleResizeObserver } from './useBubbleResizeObserver';
import { useBubbleFeaturePositionsSync } from './useBubbleFeaturePositionsSync';
import { useStartBubbleFall } from './useStartBubbleFall';
import { useBubblePositionMutators } from './useBubblePositionMutators';
import { useFallingAnimationsCleanup } from './useFallingAnimationsCleanup';

export function useBubbleLayout(options: UseBubbleLayoutOptions) {
  const { features, groups, containerRef, bubbleSize = DEFAULT_BUBBLE_SIZE, bottomInset = 0, horizontalInset = 0, onLevelChange, onGroupLevelChange, onFlushBeforeStop } =
    options;

  const [bubblePositions, setBubblePositions] = useState<Record<string, BubblePosition>>({});
  const fallingAnimations = useRef<Record<string, number>>({});
  const restYRef = useRef(DEFAULT_CONTAINER_HEIGHT - bubbleSize - bottomInset);
  const groupRestYRef = useRef(DEFAULT_CONTAINER_HEIGHT - bubbleSize - bottomInset);
  const containerWRef = useRef(400);
  const containerHRef = useRef(DEFAULT_CONTAINER_HEIGHT);
  const prevWidthRef = useRef(400);

  const clampPosition = useCallback(
    (x: number, y: number) =>
      clampBubblePosition(x, y, containerWRef.current, containerHRef.current, bubbleSize, bottomInset),
    [bubbleSize, bottomInset]
  );

  const getDistributedX = useCallback(
    (index: number, total: number, width: number) =>
      distributedBubbleX(index, total, width, bubbleSize, horizontalInset),
    [bubbleSize, horizontalInset]
  );

  useBubbleResizeObserver({
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
  });

  useBubbleFeaturePositionsSync({
    features,
    clampPosition,
    getDistributedX,
    containerWRef,
    restYRef,
    setBubblePositions,
  });

  const startBubbleFall = useStartBubbleFall({
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
  });

  useFallingAnimationsCleanup(fallingAnimations);

  const { resetBubblePositions, setBubblePosition } = useBubblePositionMutators({
    features,
    clampPosition,
    getDistributedX,
    containerWRef,
    restYRef,
    setBubblePositions,
  });

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
