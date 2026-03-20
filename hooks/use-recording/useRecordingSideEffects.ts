import type { MutableRefObject } from 'react';
import type { RecordedFrame, UseRecordingOptions } from './types';
import { useRecordingRecordIntervalEffect } from './useRecordingRecordIntervalEffect';
import { useRecordingPlaybackEffect } from './useRecordingPlaybackEffect';
import { useRecordingUnmountCleanup } from './useRecordingUnmountCleanup';

type Params = Pick<
  UseRecordingOptions,
  'applyLevelsAndSend' | 'applyBubblePositions' | 'applyGroups' | 'stopAllFeatures'
> & {
  isRecording: boolean;
  enabled: boolean;
  isPlaying: boolean;
  captureFrame: () => void;
  activeFrames: RecordedFrame[];
  setIsPlaying: (v: boolean) => void;
  recordIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  playStartRef: MutableRefObject<number>;
  playRafRef: MutableRefObject<number>;
  lastAppliedGroupsSigRef: MutableRefObject<string>;
};

export function useRecordingSideEffects({
  isRecording,
  enabled,
  captureFrame,
  recordIntervalRef,
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
  useRecordingRecordIntervalEffect({ isRecording, enabled, captureFrame, recordIntervalRef });

  useRecordingPlaybackEffect({
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
  });

  useRecordingUnmountCleanup({ recordIntervalRef, playRafRef });
}
