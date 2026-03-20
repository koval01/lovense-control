const LOVENSE_PINK = '#f20c7f';

export function getFeatureBubbleShadows(featureColor: string, bubbleSize: number) {
  const isFirst = featureColor === LOVENSE_PINK;
  const glowColor = `${featureColor}50`;
  const glowColorStrong = `${featureColor}70`;
  const baseShadow = isFirst
    ? bubbleSize < 60
      ? `0 2px 8px rgba(0,0,0,0.25), 0 0 16px ${glowColor}, 0 0 28px ${glowColor}`
      : `0 3px 12px rgba(0,0,0,0.3), 0 0 24px ${glowColor}, 0 0 40px ${glowColor}`
    : bubbleSize < 60
      ? '0 2px 8px rgba(0,0,0,0.25)'
      : '0 3px 12px rgba(0,0,0,0.3)';
  const dragShadow = isFirst
    ? bubbleSize < 60
      ? `0 2px 8px rgba(0,0,0,0.25), 0 0 20px ${glowColorStrong}, 0 0 36px ${glowColor}, 0 0 52px ${glowColor}80`
      : `0 3px 12px rgba(0,0,0,0.3), 0 0 32px ${glowColorStrong}, 0 0 48px ${glowColor}, 0 0 64px ${glowColor}80`
    : baseShadow;

  return { baseShadow, dragShadow };
}
