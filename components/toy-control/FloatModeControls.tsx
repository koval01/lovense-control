'use client';

import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import { FeatureBubble } from '@/components/FeatureBubble';
import { FeatureGroupBubble } from '@/components/FeatureGroupBubble';
import { motion, AnimatePresence } from 'motion/react';

const MERGE_ZONE_PADDING = 16;

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

  const mergeZoneRect = (() => {
    if (!mergePreview) return null;
    const tgtPos = bubblePositions[mergePreview.targetId];
    if (!tgtPos) return null;
    const size = bubbleSize + 2 * MERGE_ZONE_PADDING;
    return {
      left: tgtPos.x - MERGE_ZONE_PADDING,
      top: tgtPos.y - MERGE_ZONE_PADDING,
      width: size,
      height: size,
    };
  })();

  return (
    <div className="absolute inset-0 overflow-hidden touch-none" style={{ touchAction: 'none' }}>
      {/* Merge drop zone */}
      <AnimatePresence>
        {mergeZoneRect && (
          <motion.div
            key="merge-zone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute rounded-2xl bg-[var(--app-accent)]/15 border-2 border-dashed border-[var(--app-accent)]/55 pointer-events-none z-0"
            style={{
              left: mergeZoneRect.left,
              top: mergeZoneRect.top,
              width: mergeZoneRect.width,
              height: mergeZoneRect.height,
            }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Y-Axis Labels */}
      <div className="absolute inset-y-0 left-3 md:left-4 py-6 md:py-8 flex flex-col justify-between text-[10px] text-[var(--app-text-secondary)] font-medium pointer-events-none">
        <span>100%</span>
        <span>0</span>
      </div>

      {/* Level indicator lines */}
      <div className="absolute inset-y-0 left-10 md:left-12 right-0 flex flex-col justify-between py-6 md:py-8 pointer-events-none opacity-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full h-px bg-[var(--app-border)]" />
        ))}
      </div>

      {/* Draggable Bubbles */}
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

      {/* Group bubbles */}
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
    </div>
  );
}
