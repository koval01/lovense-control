/**
 * Records level snapshots over time and replays them.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

interface BubblePoint {
  x: number;
  y: number;
}

export interface RecordedFrame {
  t: number;
  levels: Record<string, number>;
  positions: Record<string, BubblePoint>;
  groups: string[][];
}

export interface RecordedPattern {
  id: string;
  name: string;
  frames: RecordedFrame[];
}

const RECORD_INTERVAL_MS = 33;

export interface UseRecordingOptions {
  levelsRef: React.MutableRefObject<Record<string, number>>;
  bubblePositionsRef: React.MutableRefObject<Record<string, BubblePoint>>;
  groupsRef: React.MutableRefObject<{ featureIds: string[] }[]>;
  applyLevelsAndSend: (levels: Record<string, number>) => void;
  applyBubblePositions: (positions: Record<string, BubblePoint>) => void;
  applyGroups: (groups: string[][]) => void;
  stopAllFeatures: () => void;
  enabled: boolean;
}

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

  const captureFrame = useCallback(() => {
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
  }, [levelsRef, bubblePositionsRef, groupsRef]);

  const activePattern = useMemo(() => {
    if (patterns.length === 0) return null;
    if (!activePatternId) return patterns[0] ?? null;
    return patterns.find((p) => p.id === activePatternId) ?? patterns[0] ?? null;
  }, [patterns, activePatternId]);

  const activeFrames = activePattern?.frames ?? [];
  const activePatternIndex = activePattern
    ? Math.max(0, patterns.findIndex((p) => p.id === activePattern.id))
    : 0;

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
  }, [enabled, isPlaying, captureFrame]);

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
    const nextPattern: RecordedPattern = {
      id,
      name: `Pattern ${patternNumber}`,
      frames,
    };
    setPatterns((prev) => [...prev, nextPattern]);
    setActivePatternId(id);
    recordFramesRef.current = [];
  }, [patterns.length, captureFrame]);

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
  }, [isRecording, enabled, captureFrame]);

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
  }, [enabled, activeFrames, isRecording, applyGroups]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playRafRef.current) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = 0;
    }
    stopAllFeatures();
  }, [stopAllFeatures]);

  const cyclePattern = useCallback(() => {
    if (patterns.length <= 1) return;
    const currentId = activePattern?.id ?? patterns[0]?.id;
    const currentIndex = Math.max(0, patterns.findIndex((p) => p.id === currentId));
    const nextIndex = (currentIndex + 1) % patterns.length;
    const next = patterns[nextIndex];
    if (next) setActivePatternId(next.id);
  }, [patterns, activePattern]);

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
      const levels = next
        ? (() => {
            const a = curr.t;
            const b = next.t;
            const frac = (elapsed - a) / (b - a);
            const out: Record<string, number> = {};
            const allIds = new Set([...Object.keys(curr.levels), ...Object.keys(next.levels)]);
            allIds.forEach((id) => {
              const va = curr.levels[id] ?? 0;
              const vb = next.levels[id] ?? 0;
              out[id] = va + (vb - va) * frac;
            });
            return out;
          })()
        : curr.levels;
      const positions = next
        ? (() => {
            const a = curr.t;
            const b = next.t;
            const frac = (elapsed - a) / Math.max(1, b - a);
            const out: Record<string, BubblePoint> = {};
            const allIds = new Set([
              ...Object.keys(curr.positions ?? {}),
              ...Object.keys(next.positions ?? {}),
            ]);
            allIds.forEach((id) => {
              const pa = curr.positions[id] ?? { x: 0, y: 0 };
              const pb = next.positions[id] ?? pa;
              out[id] = {
                x: pa.x + (pb.x - pa.x) * frac,
                y: pa.y + (pb.y - pa.y) * frac,
              };
            });
            return out;
          })()
        : curr.positions;
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
  }, [isPlaying, activeFrames, applyLevelsAndSend, applyBubblePositions, applyGroups, stopAllFeatures]);

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
    };
  }, []);

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
