/**
 * Manages toy features, levels, and limits derived from connected toys.
 * Handles level changes and throttled command dispatch to the Lovense API.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Toy, ToyFeature } from '@/lib/lovense-domain';
import { buildToyFeatures } from '@/lib/lovense-domain';
import { buildActionStringForToy } from '@/lib/command-serialization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLimit as setLimitAction, setLimits as setLimitsAction } from '@/store/slices/controlSlice';

const LIMITS_STORAGE_KEY = 'lovense-control-limits';

function loadStoredLimits(): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LIMITS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const out: Record<string, number> = {};
    for (const [id, val] of Object.entries(parsed)) {
      if (typeof val === 'number' && val >= 0 && Number.isFinite(val)) out[id] = val;
    }
    return out;
  } catch {
    return null;
  }
}

/** Options for useToyFeatures. */
export interface UseToyFeaturesOptions {
  /** Called when a toy's levels change (for sending commands). Throttled internally. */
  onCommand: (toyId: string, action: string, timeSec?: number) => void;
  /** When true, level changes do not trigger commands (e.g. during loop mode). */
  isLooping?: boolean;
  /** IDs of toys that are allowed to receive commands. */
  activeToyIds?: string[];
}

/** Manages features, levels, and limits from toys; dispatches throttled commands on level change. */
export function useToyFeatures(
  toys: Record<string, Toy>,
  options: UseToyFeaturesOptions
) {
  const { onCommand, isLooping = false, activeToyIds } = options;
  const dispatch = useAppDispatch();
  const limits = useAppSelector((state) => state.control.limits);
  const hasHydratedLimitsRef = useRef(false);

  const features = useMemo(() => buildToyFeatures(toys), [toys]);

  const [levels, setLevels] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    features.forEach((f) => {
      initial[f.id] = 0;
    });
    return initial;
  });

  useEffect(() => {
    const stored = hasHydratedLimitsRef.current ? null : loadStoredLimits();
    hasHydratedLimitsRef.current = true;

    const nextLimits: Record<string, number> = {};
    features.forEach((feature) => {
      const saved = limits[feature.id] ?? stored?.[feature.id];
      const valid =
        typeof saved === 'number' &&
        Number.isFinite(saved) &&
        saved >= 0 &&
        saved <= feature.maxLevel;
      nextLimits[feature.id] = valid ? saved : feature.maxLevel;
    });

    const hasRemoved = Object.keys(limits).some((featureId) => !(featureId in nextLimits));
    const hasChanged = hasRemoved || Object.entries(nextLimits).some(([featureId, value]) => limits[featureId] !== value);
    if (hasChanged) {
      dispatch(setLimitsAction(nextLimits));
    }
  }, [dispatch, features, limits]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LIMITS_STORAGE_KEY, JSON.stringify(limits));
    } catch {
      // ignore quota or other storage errors
    }
  }, [limits]);

  const levelsRef = useRef<Record<string, number>>({});
  const lastCommandTime = useRef<Record<string, number>>({});
  const pendingCommand = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  const activeToySet = useMemo(() => {
    if (!activeToyIds) return null;
    return new Set(activeToyIds);
  }, [activeToyIds]);

  const sendCommandForToy = useCallback(
    (toyId: string, forceZero: boolean = false) => {
      if (activeToySet && !activeToySet.has(toyId)) return;
      const toyFeatures = features.filter((f) => f.toyId === toyId);
      const actionString = buildActionStringForToy({
        toyFeatures,
        levels: levelsRef.current,
        limits,
        forceZero,
      });

      const isStop = forceZero || actionString.split(',').every((p) => p.endsWith(':0'));
      const throttleMs = isStop ? 0 : 50;

      const now = Date.now();
      const lastTime = lastCommandTime.current[toyId] || 0;

      if (throttleMs === 0 || now - lastTime > throttleMs) {
        onCommand(toyId, actionString, 0);
        lastCommandTime.current[toyId] = now;
        if (pendingCommand.current[toyId]) clearTimeout(pendingCommand.current[toyId]);
      } else {
        if (pendingCommand.current[toyId]) clearTimeout(pendingCommand.current[toyId]);
        pendingCommand.current[toyId] = setTimeout(() => {
          onCommand(toyId, actionString, 0);
          lastCommandTime.current[toyId] = Date.now();
        }, throttleMs);
      }
    },
    [activeToySet, features, limits, onCommand]
  );

  const flushPendingCommand = useCallback(
    (toyId: string) => {
      if (activeToySet && !activeToySet.has(toyId)) return;
      if (!pendingCommand.current[toyId]) return;
      clearTimeout(pendingCommand.current[toyId]);
      delete pendingCommand.current[toyId];
      const toyFeatures = features.filter((f) => f.toyId === toyId);
      const actionString = buildActionStringForToy({
        toyFeatures,
        levels: levelsRef.current,
        limits,
        forceZero: false,
      });
      onCommand(toyId, actionString, 0);
      lastCommandTime.current[toyId] = Date.now();
    },
    [activeToySet, features, limits, onCommand]
  );

  const handleLevelChange = useCallback(
    (featureId: string, percentage: number) => {
      levelsRef.current[featureId] = percentage;
      setLevels((prev) => {
        if (prev[featureId] === percentage) return prev;
        return { ...prev, [featureId]: percentage };
      });

      if (!isLooping) {
        const feature = features.find((f) => f.id === featureId);
        if (feature) {
          sendCommandForToy(feature.toyId, false);
        }
      }
    },
    [features, isLooping, sendCommandForToy]
  );

  const setLimit = useCallback((featureId: string, value: number) => {
    dispatch(setLimitAction({ featureId, value }));
  }, [dispatch]);

  const setLimits = useCallback((nextLimits: Record<string, number>) => {
    dispatch(setLimitsAction(nextLimits));
  }, [dispatch]);

  /** Apply a full level snapshot and send commands for all toys (e.g. for playback). */
  const applyLevelsAndSend = useCallback(
    (snapshot: Record<string, number>) => {
      levelsRef.current = { ...levelsRef.current, ...snapshot };
      setLevels((prev) => ({ ...prev, ...snapshot }));
      const toyIds = Array.from(new Set(features.map((f) => f.toyId)));
      toyIds.forEach((toyId) => sendCommandForToy(toyId, false));
    },
    [features, sendCommandForToy]
  );

  /** Immediately stop all features and send force-zero commands to every toy. */
  const stopAllFeatures = useCallback(() => {
    const zeroSnapshot: Record<string, number> = {};
    features.forEach((f) => {
      zeroSnapshot[f.id] = 0;
    });
    levelsRef.current = zeroSnapshot;
    setLevels(zeroSnapshot);

    const toyIds = Array.from(new Set(features.map((f) => f.toyId)));
    toyIds.forEach((toyId) => {
      if (pendingCommand.current[toyId]) {
        clearTimeout(pendingCommand.current[toyId]);
        delete pendingCommand.current[toyId];
      }
      sendCommandForToy(toyId, true);
    });
  }, [features, sendCommandForToy]);

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
