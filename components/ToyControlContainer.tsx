'use client';

/**
 * High-level container for toy control. Float mode (bubbles) plus limit controls
 * and recording/playback in the side panel. Built with VK UI components.
 */

import type { Toy } from '@/lib/lovense-domain';
import { useToyControlContainerModel } from '@/components/toy-control/useToyControlContainerModel';
import { ToyControlContainerView } from '@/components/toy-control/ToyControlContainerView';
import type { ToyPanelView } from '@/components/toy-control/useToyControlSidecarPhase';

export interface ToyControlContainerProps {
  toys: Record<string, Toy>;
  onCommand: (toyId: string, action: string, timeSec?: number) => void;
  activeToyIds?: string[];
  editableLimitToys?: Record<string, Toy>;
  partnerLimits?: Record<string, number>;
  interactive?: boolean;
  demoAutoplay?: boolean;
  demoPanelView?: ToyPanelView;
}

export function ToyControlContainer(props: ToyControlContainerProps) {
  const model = useToyControlContainerModel(props);
  if (model.core.features.length === 0) return null;
  return (
    <ToyControlContainerView
      toys={props.toys}
      partnerLimits={props.partnerLimits}
      interactive={props.interactive ?? true}
      model={model}
    />
  );
}
