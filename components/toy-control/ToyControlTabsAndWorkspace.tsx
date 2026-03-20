'use client';

import type { ReactNode, RefObject } from 'react';
import { Box } from '@vkontakte/vkui';
import type { ToyFeature } from '@/lib/lovense-domain';
import { LimitControls } from '@/components/toy-control/LimitControls';
import { ToyControlPanelTabs } from '@/components/toy-control/ToyControlPanelTabs';

export function ToyControlTabsAndWorkspace(props: {
  t: (key: 'maxLevel' | 'floatMode') => string;
  interactive: boolean;
  panelView: 'limits' | 'float';
  setPanelView: (v: 'limits' | 'float') => void;
  features: ToyFeature[];
  limits: Record<string, number>;
  setLimit: (id: string, v: number) => void;
  editableLimitFeatures: ToyFeature[];
  readOnlyLimitFeatures: ToyFeature[];
  partnerLimits?: Record<string, number>;
  containerRef: RefObject<HTMLDivElement | null>;
  floatPane: ReactNode;
}) {
  const {
    t,
    interactive,
    panelView,
    setPanelView,
    features,
    limits,
    setLimit,
    editableLimitFeatures,
    readOnlyLimitFeatures,
    partnerLimits,
    containerRef,
    floatPane,
  } = props;
  return (
    <div className="flex flex-col min-h-0 flex-1 md:border-r border-[var(--vkui--color_separator_secondary)]">
      <ToyControlPanelTabs
        t={t}
        interactive={interactive}
        panelView={panelView}
        setPanelView={setPanelView}
      />
      <Box
        style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}
        className={`px-0 pb-0 md:px-0 md:pb-0 ${interactive ? '' : 'pointer-events-none'}`}
      >
        {panelView === 'limits' ? (
          <div
            className="absolute inset-0 overflow-y-auto md:rounded-none md:border-0 md:bg-[var(--vkui--color_background_content)]"
            data-demo-target="limits-area"
          >
            <LimitControls
              features={features}
              limits={limits}
              onLimitChange={setLimit}
              editableFeatures={editableLimitFeatures}
              readOnlyFeatures={readOnlyLimitFeatures}
              partnerLimits={partnerLimits}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 touch-none md:rounded-none md:border-0 md:bg-[var(--vkui--color_background_content)]"
            style={{ touchAction: 'none' }}
            ref={containerRef}
            data-demo-target="float-area"
          >
            {floatPane}
          </div>
        )}
      </Box>
    </div>
  );
}
