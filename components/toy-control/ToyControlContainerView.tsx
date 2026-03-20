'use client';

import { useI18n } from '@/contexts/i18n-context';
import type { Toy } from '@/lib/lovense-domain';
import { ToyControlContainerGraphStack } from '@/components/toy-control/ToyControlContainerGraphStack';
import { ToyControlContainerControlsRow } from '@/components/toy-control/ToyControlContainerControlsRow';
import { ToyControlFloatModePane } from '@/components/toy-control/ToyControlFloatModePane';
import type { useToyControlContainerModel } from '@/components/toy-control/useToyControlContainerModel';
type Model = ReturnType<typeof useToyControlContainerModel>;

export function ToyControlContainerView(props: {
  toys: Record<string, Toy>;
  partnerLimits?: Record<string, number>;
  interactive: boolean;
  model: Model;
}) {
  const { toys, partnerLimits, interactive, model } = props;
  const { t } = useI18n();
  const { panelView, setPanelView, containerRef, isMobile, bubbleSize, bubbleHorizontalInset, core, float } =
    model;
  const rootHeightClass = interactive ? 'h-[68dvh] min-h-[420px] md:h-[78dvh]' : 'h-full';
  const floatPane = (
    <ToyControlFloatModePane
      features={core.features}
      groups={core.groups}
      bubbleSize={bubbleSize}
      horizontalInset={bubbleHorizontalInset}
      bubblePositions={float.bubblePositions}
      mergePreview={float.mergePreview}
      containerRef={containerRef}
      restYRef={float.restYRef}
      groupRestYRef={float.groupRestYRef}
      isFeatureInGroup={core.isFeatureInGroup}
      onLevelChange={core.handleLevelChange}
      onGroupLevelChange={core.handleGroupLevelChange}
      onMergePreview={float.handleMergePreview}
      onMerge={(sourceId, targetId, dropX, dropY) => {
        const targetWasInGroup = core.isFeatureInGroup(targetId);
        if (!targetWasInGroup && dropX != null && dropY != null) {
          float.setBubblePosition(sourceId, dropX, dropY);
        }
        core.mergeFeatures(sourceId, targetId);
        float.setMergePreview(null);
      }}
      onBubblePositionChange={float.setBubblePosition}
      onBubbleFall={float.startBubbleFall}
    />
  );
  return (
    <div
      className={`overflow-hidden ${rootHeightClass} flex flex-col md:rounded-[var(--app-radius-card)] md:border md:border-[var(--vkui--color_separator_secondary)] relative`}
      data-demo-target="control-root"
    >
      {!interactive && (
        <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded-md text-xs bg-[var(--app-bg-elevated)] text-[var(--app-text-secondary)] border border-[var(--app-border)] pointer-events-none">
          Demo
        </div>
      )}
      <ToyControlContainerGraphStack
        interactive={interactive}
        isMobile={isMobile}
        toys={toys}
        features={core.features}
        levelsRef={core.levelsRef}
      />
      <ToyControlContainerControlsRow
        t={t as (key: 'maxLevel' | 'floatMode') => string}
        interactive={interactive}
        panelView={panelView}
        setPanelView={setPanelView}
        partnerLimits={partnerLimits}
        containerRef={containerRef}
        floatPane={floatPane}
        model={model}
      />
    </div>
  );
}
