import type { FeatureGroup } from '@/lib/lovense-domain';

/** Options for useBubbleLayout. */
export interface UseBubbleLayoutOptions {
  features: { id: string }[];
  groups: FeatureGroup[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  bubbleSize?: number;
  bottomInset?: number;
  horizontalInset?: number;
  onLevelChange: (featureId: string, percentage: number) => void;
  onGroupLevelChange: (group: FeatureGroup, percentage: number) => void;
  /** Called at release before sending stop; use to flush pending throttled commands for the bubble's toy(s). */
  onFlushBeforeStop?: (id: string, isGroup: boolean) => void;
}
