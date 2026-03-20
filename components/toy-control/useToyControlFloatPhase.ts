'use client';

import { useState, useRef, useCallback, useEffect, type RefObject } from 'react';
import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import { useBubbleLayout } from '@/hooks/use-bubble-layout';

export function useToyControlFloatPhase(
  features: ToyFeature[],
  groups: FeatureGroup[],
  resetGroups: () => void,
  containerRef: RefObject<HTMLDivElement | null>,
  bubbleSize: number,
  bubbleBottomInset: number,
  bubbleHorizontalInset: number,
  handleLevelChange: (id: string, percentage: number) => void,
  handleGroupLevelChange: (group: FeatureGroup, percentage: number) => void,
  handleFlushBeforeStop: (id: string, isGroup: boolean) => void,
  featureLayoutKey: string
) {
  const [mergePreview, setMergePreview] = useState<{ sourceId: string; targetId: string } | null>(null);
  const bubblePositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const groupsRef = useRef<FeatureGroup[]>([]);
  const {
    bubblePositions,
    setBubblePositions,
    setBubblePosition,
    startBubbleFall,
    restYRef,
    groupRestYRef,
    resetBubblePositions,
  } = useBubbleLayout({
    features,
    groups,
    containerRef,
    bubbleSize,
    bottomInset: bubbleBottomInset,
    horizontalInset: bubbleHorizontalInset,
    onLevelChange: handleLevelChange,
    onGroupLevelChange: handleGroupLevelChange,
    onFlushBeforeStop: handleFlushBeforeStop,
  });
  const handleMergePreview = useCallback((sourceId: string, targetId: string | null) => {
    if (targetId) setMergePreview({ sourceId, targetId });
    else setMergePreview((prev) => (prev?.sourceId === sourceId ? null : prev));
  }, []);
  useEffect(() => {
    bubblePositionsRef.current = bubblePositions;
  }, [bubblePositions]);
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);
  useEffect(() => {
    setMergePreview(null);
    resetGroups();
    resetBubblePositions();
  }, [featureLayoutKey, resetGroups, resetBubblePositions]);
  return {
    mergePreview,
    setMergePreview,
    bubblePositions,
    setBubblePositions,
    setBubblePosition,
    startBubbleFall,
    restYRef,
    groupRestYRef,
    resetBubblePositions,
    bubblePositionsRef,
    groupsRef,
    handleMergePreview,
  };
}
