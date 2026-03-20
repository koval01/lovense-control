import { useCallback, type MutableRefObject } from 'react';
import type { RecordedFrame, RecordedPattern } from './types';

type Params = {
  enabled: boolean;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  setIsRecording: (v: boolean) => void;
  patterns: RecordedPattern[];
  captureFrame: () => void;
  recordFramesRef: MutableRefObject<RecordedFrame[]>;
  playRafRef: MutableRefObject<number>;
  recordStartRef: MutableRefObject<number>;
  recordIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  setPatterns: React.Dispatch<React.SetStateAction<RecordedPattern[]>>;
  setActivePatternId: (id: string | null) => void;
};

export function useRecordingCaptureActions({
  enabled,
  isPlaying,
  setIsPlaying,
  setIsRecording,
  patterns,
  captureFrame,
  recordFramesRef,
  playRafRef,
  recordStartRef,
  recordIntervalRef,
  setPatterns,
  setActivePatternId,
}: Params) {
  const startRecording = useCallback(() => {
    if (!enabled) return;
    if (isPlaying) {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      playRafRef.current = 0;
      setIsPlaying(false);
    }
    recordStartRef.current = Date.now();
    recordFramesRef.current = [];
    captureFrame();
    setIsRecording(true);
  }, [enabled, isPlaying, captureFrame, playRafRef, recordFramesRef, recordStartRef, setIsPlaying, setIsRecording]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }

    captureFrame();
    const frames = recordFramesRef.current;
    if (frames.length === 0) return;

    const id = `pattern-${Date.now()}`;
    const patternNumber = patterns.length + 1;
    setPatterns((prev) => [...prev, { id, name: `Pattern ${patternNumber}`, frames }]);
    setActivePatternId(id);
    recordFramesRef.current = [];
  }, [patterns.length, captureFrame, recordIntervalRef, setActivePatternId, setIsRecording, setPatterns]);

  return { startRecording, stopRecording };
}
