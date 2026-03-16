'use client';

/**
 * Draggable bubble for a single feature in float mode.
 * Y-position maps to power level; dragging near another bubble enables merge.
 *
 * Uses useMotionValue + style for positioning so framer-motion's drag gesture
 * manipulates the same motion values we control externally.  This avoids the
 * snap-back that occurs when animate/initial fight with the drag offset.
 */

import { useLayoutEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import type { ToyFeature } from '@/lib/lovense-domain';
import type { BubblePosition } from '@/lib/lovense-domain';

export interface FeatureBubbleProps {
  feature: ToyFeature;
  index: number;
  position: BubblePosition;
  bubbleSize: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  bubblePositions: Record<string, BubblePosition>;
  isMergeTarget: boolean;
  isFeatureInGroup: (id: string) => boolean;
  onLevelChange: (percentage: number) => void;
  onDragEnd: (releaseX: number, releaseY: number, rectHeight: number) => void;
  onMergePreview: (sourceId: string, targetId: string | null) => void;
  onPositionChange: (x: number, y: number) => void;
  demoTargetId?: string;
}

export function FeatureBubble({
  feature,
  index,
  position,
  bubbleSize,
  containerRef,
  bubblePositions,
  isMergeTarget,
  isFeatureInGroup,
  onLevelChange,
  onDragEnd,
  onMergePreview,
  onPositionChange,
  demoTargetId,
}: FeatureBubbleProps) {
  const Icon = feature.icon;
  const mvX = useMotionValue(position.x);
  const mvY = useMotionValue(position.y);

  useLayoutEffect(() => {
    mvX.set(position.x);
    mvY.set(position.y);
  }, [position.x, position.y, mvX, mvY]);

  const iconSizeClass = bubbleSize < 60 ? 'w-5 h-5' : 'w-6 h-6';
  const labelClass = bubbleSize < 60 ? 'text-[8px]' : 'text-[9px]';

  // Lovense-style: first=pink with glow, second+=blue solid (no glow)
  const isFirst = feature.color === '#f20c7f';
  const glowColor = `${feature.color}50`;
  const glowColorStrong = `${feature.color}70`;
  const baseShadow = isFirst
    ? bubbleSize < 60
      ? `0 2px 8px rgba(0,0,0,0.25), 0 0 16px ${glowColor}, 0 0 28px ${glowColor}`
      : `0 3px 12px rgba(0,0,0,0.3), 0 0 24px ${glowColor}, 0 0 40px ${glowColor}`
    : bubbleSize < 60
      ? '0 2px 8px rgba(0,0,0,0.25)'
      : '0 3px 12px rgba(0,0,0,0.3)';
  const dragShadow = isFirst
    ? bubbleSize < 60
      ? `0 2px 8px rgba(0,0,0,0.25), 0 0 20px ${glowColorStrong}, 0 0 36px ${glowColor}, 0 0 52px ${glowColor}80`
      : `0 3px 12px rgba(0,0,0,0.3), 0 0 32px ${glowColorStrong}, 0 0 48px ${glowColor}, 0 0 64px ${glowColor}80`
    : baseShadow;

  return (
    <motion.div
      data-demo-target={demoTargetId}
      layout
      drag
      dragConstraints={containerRef}
      dragElastic={0}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.18 }}
      onDrag={(_e, info) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        onPositionChange(mvX.get(), mvY.get());
        const y = info.point.y - rect.top;
        let percentage = 1 - y / rect.height;
        percentage = Math.max(0, Math.min(1, percentage));
        onLevelChange(percentage * 100);

        const x = info.point.x - rect.left;
        let closestId: string | null = null;
        let closestDist = Infinity;
        Object.entries(bubblePositions).forEach(([otherId, otherPos]) => {
          if (otherId === feature.id || isFeatureInGroup(otherId)) return;
          const dx = otherPos.x - x;
          const dy = otherPos.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = otherId;
          }
        });
        if (closestId && closestDist < bubbleSize) {
          onMergePreview(feature.id, closestId);
        } else {
          onMergePreview(feature.id, null);
        }
      }}
      onDragEnd={() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        onDragEnd(mvX.get(), mvY.get(), rect.height);
      }}
      style={{
        x: mvX,
        y: mvY,
        backgroundColor: feature.color,
        boxShadow: baseShadow,
        touchAction: 'none',
        width: bubbleSize,
        height: bubbleSize,
      }}
      className={`absolute left-0 top-0 rounded-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-white z-10 touch-none ${
        isMergeTarget ? 'ring-2 ring-white/80' : ''
      }`}
      whileHover={{ scale: 1.05, boxShadow: dragShadow }}
      whileTap={{ scale: 0.95 }}
      whileDrag={{ scale: 1.02, boxShadow: dragShadow }}
    >
      <Icon className={`${iconSizeClass} mb-0.5`} />
      <span className={`${labelClass} font-bold leading-none`}>{feature.toyName}</span>
    </motion.div>
  );
}
