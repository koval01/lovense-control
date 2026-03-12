'use client';

export type SpotlightRect = { left: number; top: number; right: number; bottom: number } | null;

export function buildSpotlightRect(highlightRect: DOMRect | null, viewportWidth: number, viewportHeight: number) {
  if (!highlightRect) return null;
  const pad = 6;
  return {
    left: Math.max(0, highlightRect.left - pad),
    top: Math.max(0, highlightRect.top - pad),
    right: Math.min(viewportWidth, highlightRect.right + pad),
    bottom: Math.min(viewportHeight, highlightRect.bottom + pad),
  };
}

export function buildTooltipPosition(highlightRect: DOMRect | null, viewportWidth: number, viewportHeight: number) {
  if (!highlightRect) {
    return { pointerLeft: 0, pointerTop: 0, tooltipLeft: 16, tooltipTop: 16 };
  }
  const tooltipWidth = 320;
  const tooltipHeight = 128;
  const canPlaceBelow = highlightRect.bottom + 14 + tooltipHeight <= viewportHeight - 16;

  const pointerLeft = Math.max(16, Math.min(highlightRect.left + highlightRect.width / 2 - 16, viewportWidth - 42));
  const pointerTop = canPlaceBelow
    ? Math.min(highlightRect.bottom - 14, viewportHeight - 42)
    : Math.max(highlightRect.top - 18, 16);

  const tooltipLeft = Math.max(
    16,
    Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - 16)
  );
  const tooltipTop = canPlaceBelow
    ? Math.min(highlightRect.bottom + 14, viewportHeight - tooltipHeight - 16)
    : Math.max(16, highlightRect.top - tooltipHeight - 12);

  return { pointerLeft, pointerTop, tooltipLeft, tooltipTop };
}
