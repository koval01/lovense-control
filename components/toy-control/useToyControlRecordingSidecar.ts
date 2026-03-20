import { useCallback, type MutableRefObject } from 'react';
import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import { useRecording } from '@/hooks/use-recording';
import { buildPlaybackFeatureGroups } from '@/components/toy-control/toy-playback-groups';

export function useToyControlRecordingSidecar(
  features: ToyFeature[],
  groups: FeatureGroup[],
  levelsRef: React.MutableRefObject<Record<string, number>>,
  bubblePositionsRef: MutableRefObject<Record<string, { x: number; y: number }>>,
  groupsRef: MutableRefObject<FeatureGroup[]>,
  applyLevelsAndSend: (snapshot: Record<string, number>) => void,
  setBubblePositions: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }>>>,
  setGroups: (next: FeatureGroup[] | ((current: FeatureGroup[]) => FeatureGroup[])) => void,
  stopAllFeatures: () => void,
  containerRef: React.RefObject<HTMLDivElement | null>,
  isFeatureInGroup: (id: string) => boolean,
  startBubbleFall: (
    id: string,
    x: number,
    y: number,
    rectHeight: number,
    isGroup: boolean
  ) => void
) {
  const {
    isRecording,
    isPlaying,
    hasRecording,
    patternCount,
    activePatternIndex,
    cyclePattern,
    startRecording,
    stopRecording,
    play,
    stopPlayback,
  } = useRecording({
    levelsRef,
    bubblePositionsRef,
    groupsRef,
    applyLevelsAndSend,
    applyBubblePositions: (positions) => {
      setBubblePositions((prev) => ({ ...prev, ...positions }));
    },
    applyGroups: (recordedGroups) => buildPlaybackFeatureGroups(recordedGroups, features, setGroups),
    stopAllFeatures,
    enabled: features.length > 0,
  });

  const handleRecordToggle = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const dropAllBubbles = useCallback(() => {
    const rectHeight = containerRef.current?.getBoundingClientRect().height ?? 0;
    groups.forEach((group) => {
      const anchorId = group.featureIds[0];
      if (!anchorId) return;
      const pos = bubblePositionsRef.current[anchorId];
      if (!pos) return;
      startBubbleFall(group.id, pos.x, pos.y, rectHeight, true);
    });
    features.forEach((feature) => {
      if (isFeatureInGroup(feature.id)) return;
      const pos = bubblePositionsRef.current[feature.id];
      if (!pos) return;
      startBubbleFall(feature.id, pos.x, pos.y, rectHeight, false);
    });
  }, [groups, features, isFeatureInGroup, startBubbleFall, bubblePositionsRef, containerRef]);

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      dropAllBubbles();
    } else {
      play();
    }
  }, [isPlaying, play, stopPlayback, dropAllBubbles]);

  return {
    isRecording,
    isPlaying,
    hasRecording,
    patternCount,
    activePatternIndex,
    cyclePattern,
    handleRecordToggle,
    handlePlayToggle,
  };
}
