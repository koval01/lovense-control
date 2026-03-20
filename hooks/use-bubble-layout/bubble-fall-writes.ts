import type { BubblePosition, FeatureGroup } from '@/lib/lovense-domain';

export function setFallBubblePos(
  setBubblePositions: React.Dispatch<React.SetStateAction<Record<string, BubblePosition>>>,
  groups: FeatureGroup[],
  dragId: string,
  isGroup: boolean,
  pos: BubblePosition
): void {
  if (isGroup) {
    const group = groups.find((g) => g.id === dragId);
    if (!group) return;
    const anchorId = group.featureIds[0];
    setBubblePositions((prev) => ({ ...prev, [anchorId]: pos }));
    return;
  }
  setBubblePositions((prev) => ({ ...prev, [dragId]: pos }));
}

export function resolveFallGroup(groups: FeatureGroup[], dragId: string, isGroup: boolean): FeatureGroup | undefined {
  return isGroup ? groups.find((g) => g.id === dragId) : undefined;
}
