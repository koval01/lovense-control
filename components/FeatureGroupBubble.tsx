'use client';

/**
 * Draggable bubble for a merged group of features in float mode.
 * Uses useMotionValue for positioning (same approach as FeatureBubble).
 */

import { useLayoutEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import type { BubblePosition } from '@/lib/lovense-domain';
import { useI18n } from '@/contexts/i18n-context';

export interface FeatureGroupBubbleProps {
  group: FeatureGroup;
  groupFeatures: ToyFeature[];
  index: number;
  position: BubblePosition;
  bubbleSize: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDrag: (percentage: number) => void;
  onPositionChange: (x: number, y: number) => void;
  onDragEnd: (releaseX: number, releaseY: number, rectHeight: number) => void;
}

export function FeatureGroupBubble({
  group,
  groupFeatures,
  index,
  position,
  bubbleSize,
  containerRef,
  onDrag,
  onPositionChange,
  onDragEnd,
}: FeatureGroupBubbleProps) {
  const Icon = groupFeatures[0]?.icon;
  const { t } = useI18n();
  const mvX = useMotionValue(position.x);
  const mvY = useMotionValue(position.y);
  const iconSizeClass = bubbleSize < 60 ? 'w-5 h-5' : 'w-6 h-6';
  const namesClass = bubbleSize < 60 ? 'text-[7px]' : 'text-[8px]';
  const countClass = bubbleSize < 60 ? 'text-[7px]' : 'text-[8px]';

  useLayoutEffect(() => {
    mvX.set(position.x);
    mvY.set(position.y);
  }, [position.x, position.y, mvX, mvY]);

  return (
    <motion.div
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
        onDrag(percentage * 100);
      }}
      onDragEnd={() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        onDragEnd(mvX.get(), mvY.get(), rect.height);
      }}
      style={{
        x: mvX,
        y: mvY,
        backgroundColor: group.color,
        boxShadow: bubbleSize < 60 ? '0 1px 6px rgba(0,0,0,0.22)' : '0 2px 12px rgba(0,0,0,0.3)',
        touchAction: 'none',
        width: bubbleSize,
        height: bubbleSize,
      }}
      className="absolute left-0 top-0 rounded-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-white z-10 border-2 border-white/40 touch-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className={`${iconSizeClass} mb-0.5`} />
      <span className={`${namesClass} font-semibold leading-tight text-center px-1`}>
        {Array.from(new Set(groupFeatures.map((f) => f.toyName)))
          .slice(0, 2)
          .join(', ')}
        {groupFeatures.length > 2 ? '…' : ''}
      </span>
      <span className={`${countClass} leading-none mt-0.5`}>
        {t('sliders', { count: group.featureIds.length })}
      </span>
    </motion.div>
  );
}
