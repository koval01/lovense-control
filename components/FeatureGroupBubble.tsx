'use client';

/**
 * Draggable bubble for a merged group of features in float mode.
 */

import { useLayoutEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import type { ToyFeature, FeatureGroup, BubblePosition } from '@/lib/lovense-domain';
import { useI18n } from '@/contexts/i18n-context';
import { getGroupBubbleShadows } from '@/components/feature-group-bubble-shadows';
import { FeatureGroupBubbleLabels } from '@/components/FeatureGroupBubbleLabels';

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
  index: _index,
  position,
  bubbleSize,
  containerRef,
  onDrag,
  onPositionChange,
  onDragEnd,
}: FeatureGroupBubbleProps) {
  const { t } = useI18n();
  const mvX = useMotionValue(position.x);
  const mvY = useMotionValue(position.y);

  const isDual = groupFeatures.length >= 2;
  const groupBg = isDual ? 'var(--app-gradient-accent)' : group.color;
  const { baseShadow, dragShadow } = getGroupBubbleShadows(group.color, bubbleSize);

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
        onDrag(Math.max(0, Math.min(1, percentage)) * 100);
      }}
      onDragEnd={() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        onDragEnd(mvX.get(), mvY.get(), rect.height);
      }}
      style={{
        x: mvX,
        y: mvY,
        background: groupBg,
        boxShadow: baseShadow,
        touchAction: 'none',
        width: bubbleSize,
        height: bubbleSize,
      }}
      className="absolute left-0 top-0 rounded-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-white z-10 border-2 border-white/40 touch-none"
      whileHover={{ scale: 1.05, boxShadow: dragShadow }}
      whileTap={{ scale: 0.95 }}
      whileDrag={{ scale: 1.02, boxShadow: dragShadow }}
    >
      <FeatureGroupBubbleLabels
        group={group}
        groupFeatures={groupFeatures}
        bubbleSize={bubbleSize}
        slidersLabel={t('sliders', { count: group.featureIds.length })}
      />
    </motion.div>
  );
}
