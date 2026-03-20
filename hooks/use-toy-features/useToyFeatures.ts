/**
 * Manages toy features, levels, and limits derived from connected toys.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import { buildToyFeatures } from '@/lib/lovense-domain';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLimit as setLimitAction, setLimits as setLimitsAction } from '@/store/slices/controlSlice';
import type { UseToyFeaturesOptions } from './types';
import { useToyLimitsEffects } from './useToyLimitsEffects';
import { useToyCommandDispatch } from './useToyCommandDispatch';
import { useToyPlaybackCommands } from './useToyPlaybackCommands';
import { useToyLevelChangeHandler } from './useToyLevelChangeHandler';

export function useToyFeatures(toys: Record<string, Toy>, options: UseToyFeaturesOptions) {
  const { onCommand, isLooping = false, activeToyIds, allToysForLimits } = options;
  const dispatch = useAppDispatch();
  const limits = useAppSelector((state) => state.control.limits);

  const features = useMemo(() => buildToyFeatures(toys), [toys]);
  const limitFeatures = useMemo(
    () => (allToysForLimits ? buildToyFeatures(allToysForLimits) : features),
    [allToysForLimits, features]
  );

  const [levels, setLevels] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    features.forEach((f) => {
      initial[f.id] = 0;
    });
    return initial;
  });

  useToyLimitsEffects({ dispatch, limitFeatures, limits });

  const { levelsRef, sendCommandForToy, flushPendingCommand, pendingCommand } = useToyCommandDispatch({
    features,
    limits,
    onCommand,
    activeToyIds,
  });

  const { applyLevelsAndSend: applyPlayback, stopAllFeatures: stopPlayback } = useToyPlaybackCommands({
    features,
    levelsRef,
    sendCommandForToy,
    pendingCommand,
  });

  useEffect(() => {
    levelsRef.current = levels;
  }, [levels, levelsRef]);

  const handleLevelChange = useToyLevelChangeHandler({
    features,
    isLooping,
    levelsRef,
    sendCommandForToy,
    setLevels,
  });

  const setLimit = useCallback(
    (featureId: string, value: number) => {
      dispatch(setLimitAction({ featureId, value }));
    },
    [dispatch]
  );

  const setLimits = useCallback(
    (nextLimits: Record<string, number>) => {
      dispatch(setLimitsAction(nextLimits));
    },
    [dispatch]
  );

  const applyLevelsAndSend = useCallback((snapshot: Record<string, number>) => applyPlayback(snapshot, setLevels), [applyPlayback]);

  const stopAllFeatures = useCallback(() => stopPlayback(setLevels), [stopPlayback]);

  return {
    features,
    levels,
    limits,
    setLimits,
    levelsRef,
    handleLevelChange,
    setLimit,
    sendCommandForToy,
    flushPendingCommand,
    applyLevelsAndSend,
    stopAllFeatures,
  };
}
