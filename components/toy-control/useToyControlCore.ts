'use client';

import { useMemo, useCallback } from 'react';
import { buildToyFeatures, type Toy, type ToyFeature, type FeatureGroup } from '@/lib/lovense-domain';
import { useToyFeatures } from '@/hooks/use-toy-features';
import { useFeatureGroups } from '@/hooks/use-feature-groups';

export interface UseToyControlCoreArgs {
  toys: Record<string, Toy>;
  onCommand: (toyId: string, action: string, timeSec?: number) => void;
  activeToyIds?: string[];
  editableLimitToys?: Record<string, Toy>;
}

export function useToyControlCore({
  toys,
  onCommand,
  activeToyIds,
  editableLimitToys,
}: UseToyControlCoreArgs) {
  const allToysForLimits = useMemo(
    () => (editableLimitToys ? { ...editableLimitToys, ...toys } : toys),
    [editableLimitToys, toys]
  );
  const {
    features,
    limits,
    setLimit,
    levelsRef,
    handleLevelChange,
    flushPendingCommand,
    applyLevelsAndSend,
    stopAllFeatures,
  } = useToyFeatures(toys, { onCommand, activeToyIds, allToysForLimits });
  const editableLimitFeatures = useMemo(
    () => (editableLimitToys ? buildToyFeatures(editableLimitToys) : features),
    [editableLimitToys, features]
  );
  const readOnlyLimitFeatures = useMemo(
    () => (editableLimitToys ? features : []),
    [editableLimitToys, features]
  );
  const { groups, setGroups, isFeatureInGroup, mergeFeatures, resetGroups } = useFeatureGroups(features);
  const handleGroupLevelChange = useCallback(
    (group: FeatureGroup, percentage: number) => {
      group.featureIds.forEach((id) => handleLevelChange(id, percentage));
    },
    [handleLevelChange]
  );
  const handleFlushBeforeStop = useCallback(
    (id: string, isGroup: boolean) => {
      if (isGroup) {
        const group = groups.find((g) => g.id === id);
        if (group) {
          const toyIds = Array.from(
            new Set(
              group.featureIds
                .map((fid) => features.find((f) => f.id === fid)?.toyId)
                .filter(Boolean) as string[]
            )
          );
          toyIds.forEach((toyId) => flushPendingCommand(toyId));
        }
      } else {
        const feature = features.find((f) => f.id === id);
        if (feature) flushPendingCommand(feature.toyId);
      }
    },
    [features, groups, flushPendingCommand]
  );
  const featureLayoutKey = useMemo(
    () => features.map((f) => f.id).sort().join('|'),
    [features]
  );
  return {
    features,
    limits,
    setLimit,
    levelsRef,
    handleLevelChange,
    applyLevelsAndSend,
    stopAllFeatures,
    editableLimitFeatures,
    readOnlyLimitFeatures,
    groups,
    setGroups,
    isFeatureInGroup,
    mergeFeatures,
    resetGroups,
    handleGroupLevelChange,
    handleFlushBeforeStop,
    featureLayoutKey,
  };
}
