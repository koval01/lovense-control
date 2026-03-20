export function easeInOutDemo(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function clampDemo(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function pickNextFloatDemoTarget(
  baseX: number,
  baseY: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
) {
  const rangeY = Math.max(1, maxY - minY);
  const usesSmallStep = Math.random() < 0.6;
  const distance =
    (usesSmallStep ? 0.14 + Math.random() * 0.18 : 0.32 + Math.random() * 0.35) * rangeY;
  const direction = Math.random() < 0.5 ? -1 : 1;
  let nextY = clampDemo(baseY + direction * distance, minY, maxY);
  if (Math.abs(nextY - baseY) < rangeY * 0.08) {
    nextY = clampDemo(baseY + direction * rangeY * 0.2, minY, maxY);
  }
  const lateral = (Math.random() - 0.5) * Math.max(8, (maxX - minX) * 0.9);
  const nextX = clampDemo(baseX + lateral, minX, maxX);
  return { nextX, nextY };
}
