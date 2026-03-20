import {
  Waves,
  RotateCw,
  Activity,
  MoveVertical,
  Hand,
  Wind,
  ArrowDownToLine,
  MoveUp,
  type LucideIcon,
} from 'lucide-react';

const LOVENSE_PINK = '#f20c7f';
const LOVENSE_BLUE = '#49a0f7';

/** Returns color by index (first=pink, second and third+=blue). */
export function getFeatureColorByIndex(index: number): string {
  return index === 0 ? LOVENSE_PINK : LOVENSE_BLUE;
}

/** @deprecated Use getFeatureColorByIndex. Kept for compatibility. */
export function getFeatureColor(_feature: string): string {
  return LOVENSE_PINK;
}

/** Returns the Lucide icon component for the given feature name. */
export function getFeatureIcon(feature: string): LucideIcon {
  if (feature.includes('Vibrate')) return Waves;
  if (feature.includes('Rotate')) return RotateCw;
  if (feature.includes('Pump')) return ArrowDownToLine;
  if (feature.includes('Oscillate')) return Activity;
  if (feature.includes('Thrusting')) return MoveVertical;
  if (feature.includes('Fingering')) return Hand;
  if (feature.includes('Suction')) return Wind;
  if (feature.includes('Depth')) return ArrowDownToLine;
  if (feature.includes('Stroke')) return MoveUp;
  return Waves;
}
