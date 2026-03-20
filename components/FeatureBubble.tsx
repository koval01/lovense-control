'use client';

import { useLayoutEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { getFeatureBubbleShadows } from '@/components/feature-bubble-shadows';
import { findClosestBubbleNeighbor } from '@/components/feature-bubble-merge';
import type { FeatureBubbleProps } from '@/components/feature-bubble-types';

export type { FeatureBubbleProps } from '@/components/feature-bubble-types';

export function FeatureBubble({
  feature,
  index: _index,
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
  const { baseShadow, dragShadow } = getFeatureBubbleShadows(feature.color, bubbleSize);

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
        onLevelChange(Math.max(0, Math.min(1, 1 - y / rect.height)) * 100);
        const x = info.point.x - rect.left;
        onMergePreview(feature.id, findClosestBubbleNeighbor(x, y, feature.id, bubblePositions, isFeatureInGroup, bubbleSize));
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
