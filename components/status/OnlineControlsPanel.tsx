'use client';

import { AnimatePresence, motion } from 'motion/react';
import { EmptyState } from '@/components/status/EmptyState';

interface OnlineControlsPanelProps {
  activeCount: number;
  children: React.ReactNode;
}

export function OnlineControlsPanel({ activeCount, children }: OnlineControlsPanelProps) {
  return (
    <div className="min-h-0 flex-1 w-full app-safe-bottom-pad">
      <AnimatePresence mode="wait" initial={false}>
        {activeCount > 0 ? (
          <motion.div
            key="controls"
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="empty-selected"
            className="w-full h-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <EmptyState titleKey="noToysSelected" hintKey="emptySelectionHint" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
