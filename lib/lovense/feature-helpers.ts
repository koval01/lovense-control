/**
 * Pure helpers for toy features: colors, icons, feature lists.
 */

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
import type { Toy, ToyFeature } from './types';
import { FEATURE_MAX_LEVELS } from './constants';

/** Returns a hex color for the given feature name. */
export function getFeatureColor(feature: string): string {
  if (feature === 'Vibrate1' || feature === 'Vibrate') return '#FF375F';
  if (feature === 'Vibrate2') return '#0A84FF';
  if (feature.includes('Rotate')) return '#FF9F0A';
  if (feature.includes('Pump')) return '#30D158';
  if (feature.includes('Oscillate')) return '#BF5AF2';
  if (feature.includes('Thrusting')) return '#64D2FF';
  if (feature.includes('Fingering')) return '#5E5CE6';
  if (feature.includes('Suction')) return '#40C8E0';
  if (feature.includes('Depth')) return '#A3CF30';
  if (feature.includes('Stroke')) return '#FFD60A';
  return '#8E8E93';
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

/** Returns the list of feature names supported by a toy type (e.g. "Nora", "Max"). */
export function getFeaturesForToy(type: string, reportedFunctions?: string[]): string[] {
  const t = type.toLowerCase();
  const normalizeToken = (token: string): string => {
    const raw = token.trim();
    const shortToFull: Record<string, string> = {
      v: 'Vibrate',
      v1: 'Vibrate1',
      v2: 'Vibrate2',
      r: 'Rotate',
      p: 'Pump',
      t: 'Thrusting',
      f: 'Fingering',
      s: 'Suction',
      d: 'Depth',
      st: 'Stroke',
      o: 'Oscillate',
    };

    const mapped = shortToFull[raw.toLowerCase()] || raw;
    const known = new Set([
      'Vibrate',
      'Vibrate1',
      'Vibrate2',
      'Rotate',
      'Pump',
      'Thrusting',
      'Fingering',
      'Suction',
      'Depth',
      'Stroke',
      'Oscillate',
    ]);
    return known.has(mapped) ? mapped : '';
  };

  if (reportedFunctions?.length) {
    const normalized = Array.from(
      new Set(
        reportedFunctions
          .map(normalizeToken)
          .filter((feature): feature is string => Boolean(feature))
      )
    );
    if (normalized.length > 0) {
      return normalized;
    }
  }

  if (t.includes('edge') || t.includes('diamo')) {
    return ['Vibrate1', 'Vibrate2'];
  }

  if (t.includes('nora')) return ['Vibrate', 'Rotate'];
  if (t.includes('max')) return ['Vibrate', 'Rotate', 'Pump'];
  if (t.includes('domi')) return ['Vibrate'];
  if (t.includes('flexer')) return ['Vibrate', 'Fingering'];
  if (t.includes('tenera')) return ['Vibrate', 'Suction'];

  return ['Vibrate'];
}

/** Builds the full list of ToyFeature entries from connected toys. */
export function buildToyFeatures(toys: Record<string, Toy>): ToyFeature[] {
  const list: ToyFeature[] = [];
  Object.values(toys).forEach((toy) => {
    const toyFeatures = getFeaturesForToy(toy.toyType || toy.name, toy.supportedFunctions);
    toyFeatures.forEach((featureName) => {
      const baseName = featureName.replace(/\d+$/, '');
      const maxLevel = FEATURE_MAX_LEVELS[baseName] ?? 20;
      list.push({
        id: `${toy.id}:${featureName}`,
        toyId: toy.id,
        toyName: toy.name,
        featureName,
        maxLevel,
        color: getFeatureColor(featureName),
        icon: getFeatureIcon(featureName),
      });
    });
  });
  return list;
}
