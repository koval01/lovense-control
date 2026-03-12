'use client';

/**
 * Re-exports ToyControlContainer as CombinedToyControl for backward compatibility.
 * Use ToyControlContainer for new code.
 */

import { ToyControlContainer } from '@/components/ToyControlContainer';
import type { Toy } from '@/lib/lovense-domain';

export interface CombinedToyControlProps {
  toys: Record<string, Toy>;
  onCommand: (toyId: string, action: string, timeSec?: number) => void;
}

/** @deprecated Use ToyControlContainer instead. */
export function CombinedToyControl({ toys, onCommand }: CombinedToyControlProps) {
  return <ToyControlContainer toys={toys} onCommand={onCommand} />;
}
