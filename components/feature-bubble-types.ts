import type { ToyFeature, BubblePosition } from '@/lib/lovense-domain';

export interface FeatureBubbleProps {
  feature: ToyFeature;
  index: number;
  position: BubblePosition;
  bubbleSize: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  bubblePositions: Record<string, BubblePosition>;
  isMergeTarget: boolean;
  isFeatureInGroup: (id: string) => boolean;
  onLevelChange: (percentage: number) => void;
  onDragEnd: (releaseX: number, releaseY: number, rectHeight: number) => void;
  onMergePreview: (sourceId: string, targetId: string | null) => void;
  onPositionChange: (x: number, y: number) => void;
  demoTargetId?: string;
}
