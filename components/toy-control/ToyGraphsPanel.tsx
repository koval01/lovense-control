'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'motion/react';
import type { Toy, ToyFeature } from '@/lib/lovense-domain';

const MotorGraph = dynamic(
  () => import('@/components/MotorGraph').then((m) => ({ default: m.MotorGraph })),
  { ssr: false }
);

export interface ToyGraphsPanelProps {
  toys: Record<string, Toy>;
  features: ToyFeature[];
  levelsRef: React.MutableRefObject<Record<string, number>>;
  compact?: boolean;
  ultraCompact?: boolean;
}

export function ToyGraphsPanel({
  toys,
  features,
  levelsRef,
  compact = false,
  ultraCompact = false,
}: ToyGraphsPanelProps) {
  const toyList = Object.values(toys);
  const splitUltraCompact = ultraCompact && toyList.length === 2;

  return (
    <div
      className={`shrink-0 bg-[var(--vkui--color_background_secondary)]/60 ${
        splitUltraCompact
          ? 'grid grid-cols-2 border-b border-[var(--vkui--color_separator_secondary)]'
          : 'flex flex-col'
      }`}
    >
      <AnimatePresence initial={false}>
        {toyList.map((toy) => (
          <motion.div
            key={toy.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`${
              splitUltraCompact
                ? 'min-w-0 border-r border-[var(--vkui--color_separator_secondary)] last:border-r-0'
                : '[&:not(:last-child)]:border-b [&:not(:last-child)]:border-[var(--vkui--color_separator_secondary)]'
            } bg-[var(--vkui--color_background_secondary)]/80`}
          >
            <MotorGraph
              toy={toy}
              features={features.filter((f) => f.toyId === toy.id)}
              levelsRef={levelsRef}
              compact={compact}
              ultraCompact={ultraCompact}
              splitView={splitUltraCompact}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
