'use client';

import { motion, AnimatePresence } from 'motion/react';

const MERGE_ZONE_PADDING = 16;

export function FloatModeMergeZone({
  mergePreview,
  bubblePositions,
  bubbleSize,
}: {
  mergePreview: { sourceId: string; targetId: string } | null;
  bubblePositions: Record<string, { x: number; y: number }>;
  bubbleSize: number;
}) {
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
    <AnimatePresence>
      {mergeZoneRect ? (
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
      ) : null}
    </AnimatePresence>
  );
}
