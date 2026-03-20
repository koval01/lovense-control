import type { UseRecordingOptions } from './types';
import { useRecordingSelectors } from './useRecordingSelectors';
import { useRecordingCaptureFrame } from './useRecordingCaptureFrame';
import { useRecordingStateRefs } from './useRecordingStateRefs';
import { useRecordingCaptureActions } from './useRecordingCaptureActions';
import { useRecordingPlaybackActions } from './useRecordingPlaybackActions';
import { useRecordingSideEffects } from './useRecordingSideEffects';

export function useRecording({
  levelsRef,
  bubblePositionsRef,
  groupsRef,
  applyLevelsAndSend,
  applyBubblePositions,
  applyGroups,
  stopAllFeatures,
  enabled,
}: UseRecordingOptions) {
  const {
    patterns, setPatterns, activePatternId, setActivePatternId, isRecording, setIsRecording, isPlaying, setIsPlaying,
    recordStartRef, recordFramesRef, recordIntervalRef, playStartRef, playRafRef, lastAppliedGroupsSigRef,
  } = useRecordingStateRefs();

  const captureFrame = useRecordingCaptureFrame({
    levelsRef,
    bubblePositionsRef,
    groupsRef,
    recordStartRef,
    recordFramesRef,
  });

  const { activePattern, activeFrames, activePatternIndex } = useRecordingSelectors(patterns, activePatternId);

  const { startRecording, stopRecording } = useRecordingCaptureActions({
    enabled, isPlaying, setIsPlaying, setIsRecording, patterns, captureFrame, recordFramesRef, playRafRef,
    recordStartRef, recordIntervalRef, setPatterns, setActivePatternId,
  });

  const { play, stopPlayback, cyclePattern } = useRecordingPlaybackActions({
    enabled, isRecording, setIsRecording, setIsPlaying, activeFrames, activePattern, patterns, recordIntervalRef,
    playRafRef, playStartRef, lastAppliedGroupsSigRef, applyGroups, stopAllFeatures, setActivePatternId,
  });

  useRecordingSideEffects({
    isRecording, enabled, captureFrame, recordIntervalRef, isPlaying, activeFrames, playStartRef, playRafRef,
    lastAppliedGroupsSigRef, applyLevelsAndSend, applyBubblePositions, applyGroups, stopAllFeatures, setIsPlaying,
  });

  return {
    patterns,
    isRecording,
    isPlaying,
    startRecording,
    stopRecording,
    play,
    stopPlayback,
    hasRecording: patterns.length > 0,
    activePatternIndex,
    patternCount: patterns.length,
    cyclePattern,
  };
}
