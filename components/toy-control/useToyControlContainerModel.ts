'use client';

import { useState, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Toy } from '@/lib/lovense-domain';
import { useToyControlCore, type UseToyControlCoreArgs } from '@/components/toy-control/useToyControlCore';
import { useToyControlFloatPhase } from '@/components/toy-control/useToyControlFloatPhase';
import { useToyControlSidecarPhase, type ToyPanelView } from '@/components/toy-control/useToyControlSidecarPhase';

export interface UseToyControlContainerModelArgs extends UseToyControlCoreArgs {
  demoAutoplay?: boolean;
  demoPanelView?: ToyPanelView;
}

export function useToyControlContainerModel({
  toys,
  onCommand,
  activeToyIds,
  editableLimitToys,
  demoAutoplay = false,
  demoPanelView,
}: UseToyControlContainerModelArgs) {
  const [panelView, setPanelView] = useState<ToyPanelView>('float');
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const bubbleSize = isMobile ? 56 : 64;
  const bubbleBottomInset = isMobile ? 20 : 8;
  const bubbleHorizontalInset = isMobile ? 10 : 18;
  const core = useToyControlCore({ toys, onCommand, activeToyIds, editableLimitToys });
  const float = useToyControlFloatPhase(
    core.features,
    core.groups,
    core.resetGroups,
    containerRef,
    bubbleSize,
    bubbleBottomInset,
    bubbleHorizontalInset,
    core.handleLevelChange,
    core.handleGroupLevelChange,
    core.handleFlushBeforeStop,
    core.featureLayoutKey
  );
  const recording = useToyControlSidecarPhase(
    panelView,
    setPanelView,
    demoPanelView,
    demoAutoplay,
    core.features,
    core.groups,
    core.levelsRef,
    float.bubblePositionsRef,
    float.groupsRef,
    core.applyLevelsAndSend,
    float.setBubblePositions,
    core.setGroups,
    core.stopAllFeatures,
    containerRef,
    core.isFeatureInGroup,
    float.startBubbleFall,
    bubbleSize,
    bubbleBottomInset,
    core.handleLevelChange,
    float.setBubblePosition
  );
  return {
    panelView,
    setPanelView,
    containerRef,
    isMobile,
    bubbleSize,
    bubbleBottomInset,
    bubbleHorizontalInset,
    core,
    float,
    recording,
  };
}
