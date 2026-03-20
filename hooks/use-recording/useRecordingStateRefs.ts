import { useState, useRef } from 'react';
import type { RecordedFrame, RecordedPattern } from './types';

export function useRecordingStateRefs() {
  const [patterns, setPatterns] = useState<RecordedPattern[]>([]);
  const [activePatternId, setActivePatternId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const recordStartRef = useRef(0);
  const recordFramesRef = useRef<RecordedFrame[]>([]);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playStartRef = useRef(0);
  const playRafRef = useRef<number>(0);
  const lastAppliedGroupsSigRef = useRef('');

  return {
    patterns,
    setPatterns,
    activePatternId,
    setActivePatternId,
    isRecording,
    setIsRecording,
    isPlaying,
    setIsPlaying,
    recordStartRef,
    recordFramesRef,
    recordIntervalRef,
    playStartRef,
    playRafRef,
    lastAppliedGroupsSigRef,
  };
}
