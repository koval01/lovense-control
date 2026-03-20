'use client';

import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import { FeatureGroupBubble } from '@/components/FeatureGroupBubble';
import { AnimatePresence } from 'motion/react';

export function FloatModeGroupBubbles({
  features,
  groups,
  bubbleSize,
  bubblePositions,
  containerRef,
  groupRestYRef,
  getDistributedX,
  onGroupLevelChange,
  onBubblePositionChange,
  onBubbleFall,
}: {
  features: ToyFeature[];
  groups: FeatureGroup[];
  bubbleSize: number;
  bubblePositions: Record<string, { x: number; y: number }>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  groupRestYRef: React.MutableRefObject<number>;
  getDistributedX: (index: number, total: number) => number;
  onGroupLevelChange: (group: FeatureGroup, percentage: number) => void;
  onBubblePositionChange: (id: string, x: number, y: number) => void;
  onBubbleFall: (id: string, x: number, y: number, height: number, isGroup: boolean) => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {groups.map((group, index) => {
        const groupFeatures = group.featureIds
          .map((id) => features.find((f) => f.id === id))
          .filter((f): f is ToyFeature => !!f);
        if (groupFeatures.length === 0) return null;

        const anchorId = group.featureIds[0];
        const defaultPos = { x: getDistributedX(index, groups.length), y: groupRestYRef.current };
        const pos = bubblePositions[anchorId] ?? defaultPos;

        return (
          <FeatureGroupBubble
            key={group.id}
            group={group}
            groupFeatures={groupFeatures}
            index={index}
            position={pos}
            bubbleSize={bubbleSize}
            containerRef={containerRef}
            onDrag={(pct) => onGroupLevelChange(group, pct)}
            onPositionChange={(x, y) => onBubblePositionChange(anchorId, x, y)}
            onDragEnd={(releaseX, releaseY, rectHeight) =>
              onBubbleFall(group.id, releaseX, releaseY, rectHeight, true)
            }
          />
        );
      })}
    </AnimatePresence>
  );
}
