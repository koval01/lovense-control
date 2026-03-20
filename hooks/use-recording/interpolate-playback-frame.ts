import type { BubblePoint, RecordedFrame } from './types';

export function interpolatePlaybackLevels(
  curr: RecordedFrame,
  next: RecordedFrame | undefined,
  elapsed: number
): Record<string, number> {
  if (!next) return curr.levels;
  const a = curr.t;
  const b = next.t;
  const frac = (elapsed - a) / (b - a);
  const out: Record<string, number> = {};
  const allIds = new Set([...Object.keys(curr.levels), ...Object.keys(next.levels)]);
  allIds.forEach((id) => {
    const va = curr.levels[id] ?? 0;
    const vb = next.levels[id] ?? 0;
    out[id] = va + (vb - va) * frac;
  });
  return out;
}

export function interpolatePlaybackPositions(
  curr: RecordedFrame,
  next: RecordedFrame | undefined,
  elapsed: number
): Record<string, BubblePoint> {
  if (!next) return curr.positions;
  const a = curr.t;
  const b = next.t;
  const frac = (elapsed - a) / Math.max(1, b - a);
  const out: Record<string, BubblePoint> = {};
  const allIds = new Set([
    ...Object.keys(curr.positions ?? {}),
    ...Object.keys(next.positions ?? {}),
  ]);
  allIds.forEach((id) => {
    const pa = curr.positions[id] ?? { x: 0, y: 0 };
    const pb = next.positions[id] ?? pa;
    out[id] = {
      x: pa.x + (pb.x - pa.x) * frac,
      y: pa.y + (pb.y - pa.y) * frac,
    };
  });
  return out;
}
