'use client';

import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import { FloatModeMergeZone } from './float-mode-merge-zone';
import { FloatModeAxisChrome } from './float-mode-axis-chrome';
import { FloatModeFeatureBubbles } from './float-mode-feature-bubbles';
import { FloatModeGroupBubbles } from './float-mode-group-bubbles';

export interface FloatModeControlsProps {
  features: ToyFeature[];
  groups: FeatureGroup[];
  bubbleSize: number;
  horizontalInset: number;
  bubblePositions: Record<string, { x: number; y: number }>;
  mergePreview: { sourceId: string; targetId: string } | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  restYRef: React.MutableRefObject<number>;
  groupRestYRef: React.MutableRefObject<number>;
  isFeatureInGroup: (id: string) => boolean;
  onLevelChange: (featureId: string, percentage: number) => void;
  onGroupLevelChange: (group: FeatureGroup, percentage: number) => void;
  onMergePreview: (sourceId: string, targetId: string | null) => void;
  onMerge: (sourceId: string, targetId: string, dropX?: number, dropY?: number) => void;
  onBubblePositionChange: (id: string, x: number, y: number) => void;
  onBubbleFall: (id: string, x: number, y: number, height: number, isGroup: boolean) => void;
}

export function FloatModeControls({
  features,
  groups,
  bubbleSize,
  horizontalInset,
  bubblePositions,
  mergePreview,
  containerRef,
  restYRef,
  groupRestYRef,
  isFeatureInGroup,
  onLevelChange,
  onGroupLevelChange,
  onMergePreview,
  onMerge,
  onBubblePositionChange,
  onBubbleFall,
}: FloatModeControlsProps) {
  const getDistributedX = (index: number, total: number) => {
    const width = containerRef.current?.clientWidth ?? 400;
    const maxX = Math.max(0, width - bubbleSize);
    const extraCenterPadding = Math.max(horizontalInset + bubbleSize * 0.35, 26);
    const startX = Math.min(extraCenterPadding, maxX / 2);
    const endX = Math.max(startX, maxX - extraCenterPadding);
    if (total <= 1) return maxX / 2;
    return startX + (index / (total - 1)) * (endX - startX);
  };

  return (
    <div className="absolute inset-0 overflow-hidden touch-none" style={{ touchAction: 'none' }}>
      <FloatModeMergeZone mergePreview={mergePreview} bubblePositions={bubblePositions} bubbleSize={bubbleSize} />
      <FloatModeAxisChrome />
      <FloatModeFeatureBubbles
        features={features}
        bubbleSize={bubbleSize}
        bubblePositions={bubblePositions}
        mergePreview={mergePreview}
        containerRef={containerRef}
        restYRef={restYRef}
        isFeatureInGroup={isFeatureInGroup}
        getDistributedX={getDistributedX}
        onLevelChange={onLevelChange}
        onMergePreview={onMergePreview}
        onMerge={onMerge}
        onBubblePositionChange={onBubblePositionChange}
        onBubbleFall={onBubbleFall}
      />
      <FloatModeGroupBubbles
        features={features}
        groups={groups}
        bubbleSize={bubbleSize}
        bubblePositions={bubblePositions}
        containerRef={containerRef}
        groupRestYRef={groupRestYRef}
        getDistributedX={getDistributedX}
        onGroupLevelChange={onGroupLevelChange}
        onBubblePositionChange={onBubblePositionChange}
        onBubbleFall={onBubbleFall}
      />
    </div>
  );
}
