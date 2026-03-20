'use client';

import type { RefObject } from 'react';
import type { ToyFeature } from '@/lib/lovense-domain';
import { ControlSidebar } from '@/components/toy-control';
import { ToyControlTabsAndWorkspace } from '@/components/toy-control/ToyControlTabsAndWorkspace';
import type { ToyPanelView } from '@/components/toy-control/useToyControlSidecarPhase';
import type { useToyControlContainerModel } from '@/components/toy-control/useToyControlContainerModel';

type Model = ReturnType<typeof useToyControlContainerModel>;

export function ToyControlContainerControlsRow(props: {
  t: (key: 'maxLevel' | 'floatMode') => string;
  interactive: boolean;
  panelView: ToyPanelView;
  setPanelView: (v: ToyPanelView) => void;
  partnerLimits?: Record<string, number>;
  containerRef: RefObject<HTMLDivElement | null>;
  floatPane: React.ReactNode;
  model: Model;
}) {
  const { t, interactive, panelView, setPanelView, partnerLimits, containerRef, floatPane, model } = props;
  const { core, float, recording } = model;
  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 md:h-full border-t border-[var(--vkui--color_separator_secondary)]">
      <ToyControlTabsAndWorkspace
        t={t}
        interactive={interactive}
        panelView={panelView}
        setPanelView={setPanelView}
        features={core.features}
        limits={core.limits}
        setLimit={core.setLimit}
        editableLimitFeatures={core.editableLimitFeatures}
        readOnlyLimitFeatures={core.readOnlyLimitFeatures}
        partnerLimits={partnerLimits}
        containerRef={containerRef}
        floatPane={floatPane}
      />
      <div
        data-demo-target="sidebar"
        className="w-full md:w-[152px] flex-shrink-0 z-20 border-t md:border-t-0 md:border-l border-[var(--vkui--color_separator_secondary)] bg-[var(--vkui--color_background_content)]"
      >
        <ControlSidebar
          isRecording={recording.isRecording}
          isPlaying={recording.isPlaying}
          hasRecording={recording.hasRecording}
          patternCount={recording.patternCount}
          activePatternIndex={recording.activePatternIndex}
          hasGroups={core.groups.length > 0}
          onRecordToggle={interactive ? recording.handleRecordToggle : () => {}}
          onPlayToggle={interactive ? recording.handlePlayToggle : () => {}}
          onPatternCycle={interactive ? recording.cyclePattern : () => {}}
          onResetGroups={
            interactive
              ? () => {
                  core.resetGroups();
                  float.resetBubblePositions();
                }
              : () => {}
          }
        />
      </div>
    </div>
  );
}
