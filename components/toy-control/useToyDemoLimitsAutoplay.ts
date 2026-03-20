import { useEffect } from 'react';
import type { ToyFeature } from '@/lib/lovense-domain';

export function useToyDemoLimitsAutoplay(
  demoAutoplay: boolean,
  panelView: 'limits' | 'float',
  features: ToyFeature[],
  handleLevelChange: (id: string, level: number) => void
) {
  useEffect(() => {
    if (!demoAutoplay || features.length === 0 || panelView === 'float') return;
    const interval = setInterval(() => {
      const feature = features[Math.floor(Math.random() * features.length)];
      const level = 25 + Math.round(Math.random() * 75);
      handleLevelChange(feature.id, level);
    }, 1450);
    return () => clearInterval(interval);
  }, [demoAutoplay, panelView, features, handleLevelChange]);
}
