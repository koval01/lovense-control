'use client';

import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';

export function FeatureGroupBubbleLabels({
  group,
  groupFeatures,
  bubbleSize,
  slidersLabel,
}: {
  group: FeatureGroup;
  groupFeatures: ToyFeature[];
  bubbleSize: number;
  slidersLabel: string;
}) {
  const Icon = groupFeatures[0]?.icon;
  const iconSizeClass = bubbleSize < 60 ? 'w-5 h-5' : 'w-6 h-6';
  const namesClass = bubbleSize < 60 ? 'text-[7px]' : 'text-[8px]';
  const countClass = bubbleSize < 60 ? 'text-[7px]' : 'text-[8px]';

  return (
    <>
      <Icon className={`${iconSizeClass} mb-0.5`} />
      <span className={`${namesClass} font-semibold leading-tight text-center px-1`}>
        {Array.from(new Set(groupFeatures.map((f) => f.toyName)))
          .slice(0, 2)
          .join(', ')}
        {groupFeatures.length > 2 ? '…' : ''}
      </span>
      <span className={`${countClass} leading-none mt-0.5`}>{slidersLabel}</span>
    </>
  );
}
