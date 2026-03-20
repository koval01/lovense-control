import { useEffect, type RefObject } from 'react';
import type { ToyFeature } from '@/lib/lovense-domain';
import { clampDemo, easeInOutDemo, pickNextFloatDemoTarget } from '@/components/toy-control/float-demo-helpers';

export function useToyDemoFloatAutoplay(
  demoAutoplay: boolean,
  panelView: 'limits' | 'float',
  features: ToyFeature[],
  bubbleSize: number,
  bubbleBottomInset: number,
  containerRef: RefObject<HTMLDivElement | null>,
  setBubblePosition: (id: string, x: number, y: number) => void,
  handleLevelChange: (id: string, level: number) => void
) {
  useEffect(() => {
    if (!demoAutoplay || features.length === 0 || panelView !== 'float') return;
    const leadFeature = features[0];
    if (!leadFeature) return;
    const levelUpdateMs = 70;
    let rafId = 0;
    let lastLevelUpdateTs = -Infinity;
    let isInitialized = false;
    let holdUntilTs = 0;
    let segmentStartTs = 0;
    let segmentDurationMs = 0;
    let fromX = 0;
    let fromY = 0;
    let toX = 0;
    let toY = 0;
    let currentX = 0;
    let currentY = 0;
    const animate = (now: number) => {
      if (!containerRef.current) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const maxX = Math.max(0, rect.width - bubbleSize);
      const maxY = Math.max(0, rect.height - bubbleSize - bubbleBottomInset);
      const centerX = maxX * 0.5;
      const minX = clampDemo(centerX - 18, 0, maxX);
      const maxDriftX = clampDemo(centerX + 18, 0, maxX);
      const minY = clampDemo(maxY * 0.06, 0, maxY);
      const maxDriftY = clampDemo(maxY * 0.92, minY, maxY);
      if (!isInitialized) {
        currentX = centerX;
        currentY = minY + (maxDriftY - minY) * 0.72;
        fromX = currentX;
        fromY = currentY;
        toX = currentX;
        toY = currentY;
        segmentStartTs = now;
        segmentDurationMs = 1;
        holdUntilTs = now + 120;
        isInitialized = true;
      }
      if (holdUntilTs !== 0 && now >= holdUntilTs) {
        holdUntilTs = 0;
        fromX = currentX;
        fromY = currentY;
        const { nextX, nextY } = pickNextFloatDemoTarget(fromX, fromY, minX, maxDriftX, minY, maxDriftY);
        toX = nextX;
        toY = nextY;
        const rangeY = Math.max(1, maxDriftY - minY);
        const distanceRatio = Math.abs(toY - fromY) / rangeY;
        const baseDuration = 240 + Math.random() * 760;
        segmentDurationMs = baseDuration + distanceRatio * 320;
        if (Math.random() < 0.18) segmentDurationMs *= 0.55;
        segmentStartTs = now;
      }
      if (holdUntilTs === 0) {
        const progress = Math.max(0, Math.min(1, (now - segmentStartTs) / segmentDurationMs));
        const eased = easeInOutDemo(progress);
        currentX = fromX + (toX - fromX) * eased;
        currentY = fromY + (toY - fromY) * eased;
        if (progress >= 1) {
          currentX = toX;
          currentY = toY;
          holdUntilTs = now + (45 + Math.random() * 240);
        }
      }
      const level = Math.round(Math.max(0, Math.min(100, (1 - currentY / rect.height) * 100)));
      setBubblePosition(leadFeature.id, currentX, currentY);
      if (now - lastLevelUpdateTs >= levelUpdateMs) {
        handleLevelChange(leadFeature.id, level);
        lastLevelUpdateTs = now;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [demoAutoplay, panelView, features, bubbleSize, bubbleBottomInset, containerRef, setBubblePosition, handleLevelChange]);
}
