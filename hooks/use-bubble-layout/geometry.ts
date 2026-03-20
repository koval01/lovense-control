import type { BubblePosition } from '@/lib/lovense-domain';

export function clampBubblePosition(
  x: number,
  y: number,
  containerW: number,
  containerH: number,
  bubbleSize: number,
  bottomInset: number
): BubblePosition {
  const maxX = Math.max(0, containerW - bubbleSize);
  const maxY = Math.max(0, containerH - bubbleSize - bottomInset);
  return {
    x: Math.max(0, Math.min(maxX, x)),
    y: Math.max(0, Math.min(maxY, y)),
  };
}

export function distributedBubbleX(
  index: number,
  total: number,
  width: number,
  bubbleSize: number,
  horizontalInset: number
): number {
  const maxX = Math.max(0, width - bubbleSize);
  const centerPadding = Math.max(horizontalInset + bubbleSize * 0.35, 26);
  const startX = Math.min(centerPadding, maxX / 2);
  const endX = Math.max(startX, maxX - centerPadding);
  if (total <= 1) return maxX / 2;
  return startX + (index / (total - 1)) * (endX - startX);
}
