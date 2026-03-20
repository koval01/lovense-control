import { FEATURE_MAX_LEVELS } from '@/lib/lovense/constants';

/** Compute max power % from control limits (Max Level UI). Used for bridge_set_toy_rules. */
export function maxPowerFromLimits(limits: Record<string, number> | undefined): number | undefined {
  if (!limits || Object.keys(limits).length === 0) return undefined;
  let minPct = 100;
  for (const [featureId, value] of Object.entries(limits)) {
    const maxLevel = FEATURE_MAX_LEVELS[featureId] ?? 20;
    const pct = Math.round((Math.max(1, value) / maxLevel) * 100);
    minPct = Math.min(minPct, pct);
  }
  if (minPct >= 100) return undefined;
  return Math.max(1, minPct);
}
