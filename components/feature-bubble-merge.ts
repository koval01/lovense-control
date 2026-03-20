import type { BubblePosition } from '@/lib/lovense-domain';

export function findClosestBubbleNeighbor(
  x: number,
  y: number,
  selfId: string,
  bubblePositions: Record<string, BubblePosition>,
  isFeatureInGroup: (id: string) => boolean,
  mergeDistance: number
): string | null {
  let closestId: string | null = null;
  let closestDist = Infinity;
  Object.entries(bubblePositions).forEach(([otherId, otherPos]) => {
    if (otherId === selfId || isFeatureInGroup(otherId)) return;
    const dx = otherPos.x - x;
    const dy = otherPos.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closestId = otherId;
    }
  });
  return closestId && closestDist < mergeDistance ? closestId : null;
}
