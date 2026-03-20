import type { MutableRefObject } from 'react';
import type { BubblePosition, FeatureGroup } from '@/lib/lovense-domain';

export type StartBubbleFallParams = {
  groups: FeatureGroup[];
  bubbleSize: number;
  bottomInset: number;
  onLevelChange: (featureId: string, percentage: number) => void;
  onGroupLevelChange: (group: FeatureGroup, percentage: number) => void;
  onFlushBeforeStop?: (id: string, isGroup: boolean) => void;
  fallingAnimations: MutableRefObject<Record<string, number>>;
  setBubblePositions: React.Dispatch<React.SetStateAction<Record<string, BubblePosition>>>;
  restYRef: MutableRefObject<number>;
  groupRestYRef: MutableRefObject<number>;
  containerWRef: MutableRefObject<number>;
  containerHRef: MutableRefObject<number>;
};
