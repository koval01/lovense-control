export function getGroupBubbleShadows(groupColor: string, bubbleSize: number) {
  const glowColor = `${groupColor}50`;
  const glowColorStrong = `${groupColor}70`;
  const baseShadow =
    bubbleSize < 60
      ? `0 2px 8px rgba(0,0,0,0.25), 0 0 20px ${glowColor}, 0 0 36px ${glowColor}`
      : `0 3px 12px rgba(0,0,0,0.3), 0 0 28px ${glowColor}, 0 0 48px ${glowColor}`;
  const dragShadow =
    bubbleSize < 60
      ? `0 2px 8px rgba(0,0,0,0.25), 0 0 24px ${glowColorStrong}, 0 0 44px ${glowColor}, 0 0 60px ${glowColor}80`
      : `0 3px 12px rgba(0,0,0,0.3), 0 0 36px ${glowColorStrong}, 0 0 56px ${glowColor}, 0 0 76px ${glowColor}80`;

  return { baseShadow, dragShadow };
}
