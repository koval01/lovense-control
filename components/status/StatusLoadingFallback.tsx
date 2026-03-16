'use client';

import { motion } from 'motion/react';
import { Skeleton } from '@vkontakte/vkui';
import { fadeVariants } from '@/constants/animation-variants';

/**
 * Skeleton grid mimicking toy cards. Used when loading ToyControlContainer or StatusOnlineView.
 */
function ToyCardSkeleton() {
  return (
    <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-[var(--vkui--color_separator_secondary)] bg-[var(--vkui--color_background_tertiary)]/80">
      <Skeleton width={40} height={40} borderRadius={10} className="shrink-0" />
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <Skeleton width="70%" height={14} borderRadius={4} />
        <Skeleton width="45%" height={12} borderRadius={4} />
      </div>
    </div>
  );
}

/**
 * Shared loading placeholder for dynamic imports. Skeleton grid mimicking toy cards.
 */
export function StatusLoadingFallback() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeVariants}
      className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-2 md:pt-4"
    >
      <div className="flex flex-wrap gap-2 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ToyCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
}
