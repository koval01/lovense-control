'use client';

import type { ToyFeature } from '@/lib/lovense-domain';
import { FeatureBubble } from '@/components/FeatureBubble';
import { AnimatePresence } from 'motion/react';

export function FloatModeFeatureBubbles({
  features,
  bubbleSize,
  bubblePositions,
  mergePreview,
  containerRef,
  restYRef,
  isFeatureInGroup,
  getDistributedX,
  onLevelChange,
  onMergePreview,
  onMerge,
  onBubblePositionChange,
  onBubbleFall,
}: {
  features: ToyFeature[];
  bubbleSize: number;
  bubblePositions: Record<string, { x: number; y: number }>;
  mergePreview: { sourceId: string; targetId: string } | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  restYRef: React.MutableRefObject<number>;
  isFeatureInGroup: (id: string) => boolean;
  getDistributedX: (index: number, total: number) => number;
  onLevelChange: (featureId: string, percentage: number) => void;
  onMergePreview: (sourceId: string, targetId: string | null) => void;
  onMerge: (sourceId: string, targetId: string, dropX?: number, dropY?: number) => void;
  onBubblePositionChange: (id: string, x: number, y: number) => void;
  onBubbleFall: (id: string, x: number, y: number, height: number, isGroup: boolean) => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {features.map((feature, index) => {
        if (isFeatureInGroup(feature.id)) return null;
        const defaultPos = { x: getDistributedX(index, features.length), y: restYRef.current };
        const pos = bubblePositions[feature.id] ?? defaultPos;

        return (
          <FeatureBubble
            key={feature.id}
            feature={feature}
            index={index}
            position={pos}
            bubbleSize={bubbleSize}
            containerRef={containerRef}
            bubblePositions={bubblePositions}
            isMergeTarget={mergePreview?.targetId === feature.id}
            isFeatureInGroup={isFeatureInGroup}
            onLevelChange={(pct) => onLevelChange(feature.id, pct)}
            onDragEnd={(releaseX, releaseY, rectHeight) => {
              if (mergePreview?.sourceId === feature.id) {
                onMerge(feature.id, mergePreview.targetId, releaseX, releaseY);
                return;
              }
              onBubbleFall(feature.id, releaseX, releaseY, rectHeight, false);
            }}
            onMergePreview={onMergePreview}
            onPositionChange={(x, y) => onBubblePositionChange(feature.id, x, y)}
            demoTargetId={index === 0 ? 'bubble' : undefined}
          />
        );
      })}
    </AnimatePresence>
  );
}
