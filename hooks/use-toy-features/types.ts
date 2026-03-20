import type { Toy } from '@/lib/lovense-domain';

/** Options for useToyFeatures. */
export interface UseToyFeaturesOptions {
  /** Called when a toy's levels change (for sending commands). Throttled internally. */
  onCommand: (toyId: string, action: string, timeSec?: number) => void;
  /** When true, level changes do not trigger commands (e.g. during loop mode). */
  isLooping?: boolean;
  /** IDs of toys that are allowed to receive commands. */
  activeToyIds?: string[];
  /** Optional wider toy set used to initialize/persist limits. */
  allToysForLimits?: Record<string, Toy>;
}
