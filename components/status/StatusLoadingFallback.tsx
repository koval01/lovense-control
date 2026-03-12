'use client';

import { motion } from 'motion/react';
import { fadeVariants } from '@/constants/animation-variants';

/**
 * Shared loading placeholder for dynamic imports. Fades in the spinner
 * so it doesn't appear abruptly (e.g. when loading ToyControlContainer or StatusOnlineView).
 */
export function StatusLoadingFallback() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeVariants}
      className="w-full max-w-2xl mx-auto px-4 flex items-center justify-center py-20"
    >
      <div className="w-12 h-12 border-2 border-[var(--app-border)] border-t-[var(--app-accent)] rounded-full animate-spin" />
    </motion.div>
  );
}
