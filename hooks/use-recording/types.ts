export interface BubblePoint {
  x: number;
  y: number;
}

export interface RecordedFrame {
  t: number;
  levels: Record<string, number>;
  positions: Record<string, BubblePoint>;
  groups: string[][];
}

export interface RecordedPattern {
  id: string;
  name: string;
  frames: RecordedFrame[];
}

export const RECORD_INTERVAL_MS = 33;

export interface UseRecordingOptions {
  levelsRef: React.MutableRefObject<Record<string, number>>;
  bubblePositionsRef: React.MutableRefObject<Record<string, BubblePoint>>;
  groupsRef: React.MutableRefObject<{ featureIds: string[] }[]>;
  applyLevelsAndSend: (levels: Record<string, number>) => void;
  applyBubblePositions: (positions: Record<string, BubblePoint>) => void;
  applyGroups: (groups: string[][]) => void;
  stopAllFeatures: () => void;
  enabled: boolean;
}
