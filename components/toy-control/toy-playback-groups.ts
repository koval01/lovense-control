import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';

export function buildPlaybackFeatureGroups(
  recordedGroups: string[][],
  features: ToyFeature[],
  setGroups: (g: FeatureGroup[]) => void
) {
  const used = new Set<string>();
  const nextGroups: FeatureGroup[] = [];
  recordedGroups.forEach((featureIds, index) => {
    const normalized = Array.from(
      new Set(featureIds.filter((featureId) => features.some((f) => f.id === featureId)))
    ).filter((featureId) => {
      if (used.has(featureId)) return false;
      used.add(featureId);
      return true;
    });
    if (normalized.length < 2) return;
    const anchor =
      features.find((f) => f.id === normalized[0]) ?? features.find((f) => normalized.includes(f.id));
    const stableId = normalized.slice().sort().join('__');
    nextGroups.push({
      id: `playback-group-${index}-${stableId}`,
      featureIds: normalized,
      name: 'Gruppe',
      color: anchor?.color ?? 'var(--app-accent)',
    });
  });
  setGroups(nextGroups);
}
