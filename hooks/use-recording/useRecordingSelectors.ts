import { useMemo } from 'react';
import type { RecordedPattern } from './types';

export function useRecordingSelectors(patterns: RecordedPattern[], activePatternId: string | null) {
  const activePattern = useMemo(() => {
    if (patterns.length === 0) return null;
    if (!activePatternId) return patterns[0] ?? null;
    return patterns.find((p) => p.id === activePatternId) ?? patterns[0] ?? null;
  }, [patterns, activePatternId]);

  const activeFrames = activePattern?.frames ?? [];
  const activePatternIndex = activePattern
    ? Math.max(0, patterns.findIndex((p) => p.id === activePattern.id))
    : 0;

  return { activePattern, activeFrames, activePatternIndex };
}
