import { useEffect, type MutableRefObject } from 'react';

type Params = {
  recordIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  playRafRef: MutableRefObject<number>;
};

export function useRecordingUnmountCleanup({ recordIntervalRef, playRafRef }: Params): void {
  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
    };
  }, [recordIntervalRef, playRafRef]);
}
