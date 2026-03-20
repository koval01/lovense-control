import { useEffect, type MutableRefObject } from 'react';
import { RECORD_INTERVAL_MS } from './types';

type Params = {
  isRecording: boolean;
  enabled: boolean;
  captureFrame: () => void;
  recordIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
};

export function useRecordingRecordIntervalEffect({
  isRecording,
  enabled,
  captureFrame,
  recordIntervalRef,
}: Params): void {
  useEffect(() => {
    if (!isRecording || !enabled) return;
    recordIntervalRef.current = setInterval(() => {
      captureFrame();
    }, RECORD_INTERVAL_MS);
    return () => {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
    };
  }, [isRecording, enabled, captureFrame, recordIntervalRef]);
}
