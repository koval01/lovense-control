'use client';

import type { MutableRefObject } from 'react';
import type { Toy, ToyFeature } from '@/lib/lovense-domain';
import { ToyGraphsPanel, ToyStatusBar } from '@/components/toy-control';

export function ToyControlContainerGraphStack(props: {
  interactive: boolean;
  isMobile: boolean;
  toys: Record<string, Toy>;
  features: ToyFeature[];
  levelsRef: MutableRefObject<Record<string, number>>;
}) {
  const { interactive, isMobile, toys, features, levelsRef } = props;
  return (
    <>
      <div data-demo-target="graph">
        <ToyGraphsPanel
          toys={toys}
          features={features}
          levelsRef={levelsRef}
          compact={!interactive}
          ultraCompact={interactive && isMobile}
        />
      </div>
      <div data-demo-target="status-bar">
        <ToyStatusBar toyCount={Object.keys(toys).length} />
      </div>
    </>
  );
}
