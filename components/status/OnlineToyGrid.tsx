'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { Toy } from '@/lib/lovense-domain';
import { ToyCard } from '@/components/status/ToyCard';

interface OnlineToyGridProps {
  toys: Record<string, Toy>;
  activeToyIds: string[];
  isMobile: boolean;
  onToggleToy: (toyId: string) => void;
}

export function OnlineToyGrid({ toys, activeToyIds, isMobile, onToggleToy }: OnlineToyGridProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? 8 : 12,
        marginBottom: isMobile ? 6 : 20,
        paddingLeft: isMobile ? 12 : 16,
        paddingRight: isMobile ? 12 : 16,
      }}
      className="shrink-0 md:px-0 md:mb-8 md:gap-4"
    >
      <AnimatePresence initial={false}>
        {Object.values(toys).map((toy) => (
          <motion.div
            key={toy.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <ToyCard toy={toy} isActive={activeToyIds.includes(toy.id)} onToggle={onToggleToy} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
