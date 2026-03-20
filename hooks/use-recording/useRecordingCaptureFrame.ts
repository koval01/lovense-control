import { useCallback, type MutableRefObject } from 'react';
import type { BubblePoint, RecordedFrame } from './types';

type Params = {
  levelsRef: React.MutableRefObject<Record<string, number>>;
  bubblePositionsRef: React.MutableRefObject<Record<string, BubblePoint>>;
  groupsRef: React.MutableRefObject<{ featureIds: string[] }[]>;
  recordStartRef: MutableRefObject<number>;
  recordFramesRef: MutableRefObject<RecordedFrame[]>;
};

export function useRecordingCaptureFrame({
  levelsRef,
  bubblePositionsRef,
  groupsRef,
  recordStartRef,
  recordFramesRef,
}: Params) {
  return useCallback(() => {
    const t = Date.now() - recordStartRef.current;
    const levels = { ...levelsRef.current };
    const positions = Object.fromEntries(
      Object.entries(bubblePositionsRef.current).map(([id, point]) => [
        id,
        { x: point.x, y: point.y },
      ])
    ) as Record<string, BubblePoint>;
    const groups = groupsRef.current
      .map((g) => Array.from(new Set(g.featureIds)))
      .filter((ids) => ids.length >= 2);
    recordFramesRef.current.push({ t, levels, positions, groups });
  }, [levelsRef, bubblePositionsRef, groupsRef, recordStartRef, recordFramesRef]);
}
