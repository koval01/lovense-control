'use client';

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { DemoStep } from '@/components/home/onboarding/demo/constants';

export function useDemoWalkthrough(
  containerRef: RefObject<HTMLDivElement | null>,
  activeStep: DemoStep | null
) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!activeStep) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const container = containerRef.current;
      if (!container) return;
      const targets = activeStep.targets
        .map((targetId) => container.querySelector<HTMLElement>(`[data-demo-target="${targetId}"]`))
        .filter((target): target is HTMLElement => Boolean(target));
      if (targets.length === 0) return setHighlightRect(null);

      const firstRect = targets[0].getBoundingClientRect();
      const union = targets.slice(1).reduce((acc, target) => {
        const rect = target.getBoundingClientRect();
        return {
          left: Math.min(acc.left, rect.left),
          top: Math.min(acc.top, rect.top),
          right: Math.max(acc.right, rect.right),
          bottom: Math.max(acc.bottom, rect.bottom),
        };
      }, { left: firstRect.left, top: firstRect.top, right: firstRect.right, bottom: firstRect.bottom });
      setHighlightRect(new DOMRect(union.left, union.top, union.right - union.left, union.bottom - union.top));
    };

    updateHighlight();
    const interval = setInterval(updateHighlight, 180);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [activeStep, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!activeStep || !container) return;
    const firstTarget = activeStep.targets
      .map((targetId) => container.querySelector<HTMLElement>(`[data-demo-target="${targetId}"]`))
      .find((target): target is HTMLElement => Boolean(target));
    firstTarget?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, [activeStep, containerRef]);

  return { highlightRect };
}
