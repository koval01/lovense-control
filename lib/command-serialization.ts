/**
 * Serializes toy feature levels into Lovense action strings.
 * Format: "Vibrate1:5,Rotate:10" etc.
 */

import type { ToyFeature } from './lovense';

export interface BuildActionStringInput {
  toyFeatures: ToyFeature[];
  levels: Record<string, number>;
  limits: Record<string, number>;
  /** If true, all levels are sent as 0 (e.g. when stopping). */
  forceZero?: boolean;
}

/**
 * Builds the action string for a single toy.
 * Used when sending commands to the Lovense API.
 */
export function buildActionStringForToy({
  toyFeatures,
  levels,
  limits,
  forceZero = false,
}: BuildActionStringInput): string {
  return toyFeatures
    .map((f) => {
      const pct = levels[f.id] ?? 0;
      const limit = limits[f.id] ?? f.maxLevel;
      const actualLevel = forceZero ? 0 : Math.round((pct / 100) * limit);
      return `${f.featureName}:${actualLevel}`;
    })
    .join(',');
}
