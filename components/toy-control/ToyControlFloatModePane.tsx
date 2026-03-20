'use client';

import dynamic from 'next/dynamic';
import type { MutableRefObject, RefObject } from 'react';
import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';

const FloatModeControls = dynamic(
  () => import('@/components/toy-control/FloatModeControls').then((m) => ({ default: m.FloatModeControls })),
  { ssr: false }
);

export function ToyControlFloatModePane(props: {
  features: ToyFeature[];
  groups: FeatureGroup[];
  bubbleSize: number;
  horizontalInset: number;
  bubblePositions: Record<string, { x: number; y: number }>;
  mergePreview: { sourceId: string; targetId: string } | null;
  containerRef: RefObject<HTMLDivElement | null>;
  restYRef: MutableRefObject<number>;
  groupRestYRef: MutableRefObject<number>;
  isFeatureInGroup: (id: string) => boolean;
  onLevelChange: (id: string, percentage: number) => void;
  onGroupLevelChange: (group: FeatureGroup, percentage: number) => void;
  onMergePreview: (sourceId: string, targetId: string | null) => void;
  onMerge: (sourceId: string, targetId: string, dropX?: number, dropY?: number) => void;
  onBubblePositionChange: (id: string, x: number, y: number) => void;
  onBubbleFall: (
    id: string,
    x: number,
    y: number,
    rectHeight: number,
    isGroup: boolean
  ) => void;
}) {
  return (
    <FloatModeControls
      features={props.features}
      groups={props.groups}
      bubbleSize={props.bubbleSize}
      horizontalInset={props.horizontalInset}
      bubblePositions={props.bubblePositions}
      mergePreview={props.mergePreview}
      containerRef={props.containerRef}
      restYRef={props.restYRef}
      groupRestYRef={props.groupRestYRef}
      isFeatureInGroup={props.isFeatureInGroup}
      onLevelChange={props.onLevelChange}
      onGroupLevelChange={props.onGroupLevelChange}
      onMergePreview={props.onMergePreview}
      onMerge={props.onMerge}
      onBubblePositionChange={props.onBubblePositionChange}
      onBubbleFall={props.onBubbleFall}
    />
  );
}
