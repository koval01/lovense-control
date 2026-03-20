import { useEffect, type MutableRefObject } from 'react';
import type { BubblePoint, RecordedFrame } from './types';
import { interpolatePlaybackLevels, interpolatePlaybackPositions } from './interpolate-playback-frame';

type Params = {
  isPlaying: boolean;
  activeFrames: RecordedFrame[];
  playStartRef: MutableRefObject<number>;
  playRafRef: MutableRefObject<number>;
  lastAppliedGroupsSigRef: MutableRefObject<string>;
  applyLevelsAndSend: (levels: Record<string, number>) => void;
  applyBubblePositions: (positions: Record<string, BubblePoint>) => void;
  applyGroups: (groups: string[][]) => void;
  stopAllFeatures: () => void;
  setIsPlaying: (v: boolean) => void;
};

export function useRecordingPlaybackEffect({
  isPlaying,
  activeFrames,
  playStartRef,
  playRafRef,
  lastAppliedGroupsSigRef,
  applyLevelsAndSend,
  applyBubblePositions,
  applyGroups,
  stopAllFeatures,
  setIsPlaying,
}: Params): void {
  useEffect(() => {
    if (!isPlaying || activeFrames.length === 0) return;

    const duration = activeFrames[activeFrames.length - 1]?.t ?? 0;
    if (duration === 0) {
      setIsPlaying(false);
      stopAllFeatures();
      return;
    }

    const step = () => {
      let elapsed = Date.now() - playStartRef.current;
      if (duration > 0) elapsed = elapsed % duration;
      let i = 0;
      while (i < activeFrames.length - 1 && activeFrames[i + 1]!.t <= elapsed) i++;
      const curr = activeFrames[i]!;
      const next = activeFrames[i + 1];
      const levels = interpolatePlaybackLevels(curr, next, elapsed);
      const positions = interpolatePlaybackPositions(curr, next, elapsed);
      const groups = curr.groups ?? [];
      applyLevelsAndSend(levels);
      if (positions && Object.keys(positions).length > 0) {
        applyBubblePositions(positions);
      }
      const groupsSig = JSON.stringify(groups);
      if (groupsSig !== lastAppliedGroupsSigRef.current) {
        applyGroups(groups);
        lastAppliedGroupsSigRef.current = groupsSig;
      }
      playRafRef.current = requestAnimationFrame(step);
    };

    playRafRef.current = requestAnimationFrame(step);
    return () => {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
    };
  }, [
    isPlaying,
    activeFrames,
    applyLevelsAndSend,
    applyBubblePositions,
    applyGroups,
    stopAllFeatures,
    setIsPlaying,
    playStartRef,
    playRafRef,
    lastAppliedGroupsSigRef,
  ]);
}
