import { useCallback, type MutableRefObject } from 'react';
import type { RecordedFrame, RecordedPattern } from './types';

type Params = {
  enabled: boolean;
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  setIsPlaying: (v: boolean) => void;
  activeFrames: RecordedFrame[];
  activePattern: RecordedPattern | null;
  patterns: RecordedPattern[];
  recordIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  playRafRef: MutableRefObject<number>;
  playStartRef: MutableRefObject<number>;
  lastAppliedGroupsSigRef: MutableRefObject<string>;
  applyGroups: (groups: string[][]) => void;
  stopAllFeatures: () => void;
  setActivePatternId: (id: string | null) => void;
};

export function useRecordingPlaybackActions({
  enabled,
  isRecording,
  setIsRecording,
  setIsPlaying,
  activeFrames,
  activePattern,
  patterns,
  recordIntervalRef,
  playRafRef,
  playStartRef,
  lastAppliedGroupsSigRef,
  applyGroups,
  stopAllFeatures,
  setActivePatternId,
}: Params) {
  const play = useCallback(() => {
    if (!enabled || activeFrames.length === 0) return;
    if (isRecording) {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
      setIsRecording(false);
    }
    const initialGroups = activeFrames[0]?.groups ?? [];
    applyGroups(initialGroups);
    lastAppliedGroupsSigRef.current = JSON.stringify(initialGroups);
    playStartRef.current = Date.now();
    setIsPlaying(true);
  }, [enabled, activeFrames, isRecording, applyGroups, lastAppliedGroupsSigRef, playStartRef, recordIntervalRef, setIsPlaying, setIsRecording]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playRafRef.current) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = 0;
    }
    stopAllFeatures();
  }, [playRafRef, setIsPlaying, stopAllFeatures]);

  const cyclePattern = useCallback(() => {
    if (patterns.length <= 1) return;
    const currentId = activePattern?.id ?? patterns[0]?.id;
    const currentIndex = Math.max(0, patterns.findIndex((p) => p.id === currentId));
    const nextIndex = (currentIndex + 1) % patterns.length;
    const next = patterns[nextIndex];
    if (next) setActivePatternId(next.id);
  }, [patterns, activePattern, setActivePatternId]);

  return { play, stopPlayback, cyclePattern };
}
