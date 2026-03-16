/**
 * Manages feature groups (merged bubbles) for float-mode control.
 * Handles merging, checking membership, and resetting groups.
 */

import { useCallback, useEffect } from 'react';
import type { ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  pruneGroupsByFeatureIds,
  resetGroups as resetGroupsAction,
  setGroups as setGroupsAction,
} from '@/store/slices/controlSlice';

/** Manages feature groups (merged bubbles) and merge/reset logic. */
export function useFeatureGroups(features: ToyFeature[]) {
  const dispatch = useAppDispatch();
  const groups = useAppSelector((state) => state.control.groups);

  useEffect(() => {
    dispatch(pruneGroupsByFeatureIds(features.map((feature) => feature.id)));
  }, [dispatch, features]);

  const setGroups = useCallback(
    (next: FeatureGroup[] | ((current: FeatureGroup[]) => FeatureGroup[])) => {
      const value = typeof next === 'function' ? next(groups) : next;
      dispatch(setGroupsAction(value));
    },
    [dispatch, groups]
  );

  const isFeatureInGroup = useCallback(
    (featureId: string) => groups.some((g) => g.featureIds.includes(featureId)),
    [groups]
  );

  const mergeFeatures = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;

      const existing = groups.find(
        (g) => g.featureIds.includes(sourceId) && g.featureIds.includes(targetId)
      );
      if (existing) return;

      const targetGroup = groups.find((g) => g.featureIds.includes(targetId));

      if (targetGroup && !targetGroup.featureIds.includes(sourceId)) {
        const next = groups.map((g) =>
          g.id === targetGroup.id ? { ...g, featureIds: [...g.featureIds, sourceId] } : g
        );
        dispatch(setGroupsAction(next));
        return;
      }

      const sourceFeature = features.find((f) => f.id === sourceId);
      const targetFeature = features.find((f) => f.id === targetId);
      if (!sourceFeature || !targetFeature) return;

      const newGroup: FeatureGroup = {
        id: `group-${Date.now()}`,
        featureIds: [sourceId, targetId],
        name: 'Gruppe',
        color: targetFeature.color,
      };
      dispatch(setGroupsAction([...groups, newGroup]));
    },
    [dispatch, features, groups]
  );

  const resetGroups = useCallback(() => {
    dispatch(resetGroupsAction());
  }, [dispatch]);

  return { groups, setGroups, isFeatureInGroup, mergeFeatures, resetGroups };
}
