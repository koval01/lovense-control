'use client';

import { useEffect, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from 'react';
import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import { useToyControlRecordingSidecar } from '@/components/toy-control/useToyControlRecordingSidecar';
import { useToyDemoFloatAutoplay } from '@/components/toy-control/useToyDemoFloatAutoplay';
import { useToyDemoLimitsAutoplay } from '@/components/toy-control/useToyDemoLimitsAutoplay';
export type ToyPanelView = 'limits' | 'float';

export function useToyControlSidecarPhase(
  panelView: ToyPanelView,
  setPanelView: (v: ToyPanelView) => void,
  demoPanelView: ToyPanelView | undefined,
  demoAutoplay: boolean,
  features: ToyFeature[],
  groups: FeatureGroup[],
  levelsRef: MutableRefObject<Record<string, number>>,
  bubblePositionsRef: MutableRefObject<Record<string, { x: number; y: number }>>,
  groupsRef: MutableRefObject<FeatureGroup[]>,
  applyLevelsAndSend: (snapshot: Record<string, number>) => void,
  setBubblePositions: Dispatch<SetStateAction<Record<string, { x: number; y: number }>>>,
  setGroups: (next: FeatureGroup[] | ((current: FeatureGroup[]) => FeatureGroup[])) => void,
  stopAllFeatures: () => void,
  containerRef: RefObject<HTMLDivElement | null>,
  isFeatureInGroup: (id: string) => boolean,
  startBubbleFall: (
    id: string,
    x: number,
    y: number,
    rectHeight: number,
    isGroup: boolean
  ) => void,
  bubbleSize: number,
  bubbleBottomInset: number,
  handleLevelChange: (id: string, level: number) => void,
  setBubblePosition: (id: string, x: number, y: number) => void
) {
  const recording = useToyControlRecordingSidecar(
    features,
    groups,
    levelsRef,
    bubblePositionsRef,
    groupsRef,
    applyLevelsAndSend,
    setBubblePositions,
    setGroups,
    stopAllFeatures,
    containerRef,
    isFeatureInGroup,
    startBubbleFall
  );
  useEffect(() => {
    if (!demoPanelView) return;
    setPanelView(demoPanelView);
  }, [demoPanelView, setPanelView]);
  useToyDemoFloatAutoplay(
    demoAutoplay,
    panelView,
    features,
    bubbleSize,
    bubbleBottomInset,
    containerRef,
    setBubblePosition,
    handleLevelChange
  );
  useToyDemoLimitsAutoplay(demoAutoplay, panelView, features, handleLevelChange);
  return recording;
}
