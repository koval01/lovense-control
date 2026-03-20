import { useEffect, useRef } from 'react';
import type { ToyFeature } from '@/lib/lovense-domain';
import type { AppDispatch } from '@/store';
import { setLimits as setLimitsAction } from '@/store/slices/controlSlice';
import { LIMITS_STORAGE_KEY, loadStoredLimits } from './limits-storage';

type Params = {
  dispatch: AppDispatch;
  limitFeatures: ToyFeature[];
  limits: Record<string, number>;
};

export function useToyLimitsEffects({ dispatch, limitFeatures, limits }: Params): void {
  const hasHydratedLimitsRef = useRef(false);

  useEffect(() => {
    const stored = hasHydratedLimitsRef.current ? null : loadStoredLimits();
    hasHydratedLimitsRef.current = true;

    const nextLimits: Record<string, number> = { ...limits };
    limitFeatures.forEach((feature) => {
      const saved = limits[feature.id] ?? stored?.[feature.id];
      const valid =
        typeof saved === 'number' &&
        Number.isFinite(saved) &&
        saved >= 1 &&
        saved <= feature.maxLevel;
      nextLimits[feature.id] = valid ? saved : feature.maxLevel;
    });

    const hasChanged = Object.entries(nextLimits).some(([featureId, value]) => limits[featureId] !== value);
    if (hasChanged) {
      dispatch(setLimitsAction(nextLimits));
    }
  }, [dispatch, limitFeatures, limits]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LIMITS_STORAGE_KEY, JSON.stringify(limits));
    } catch {
      // ignore quota or other storage errors
    }
  }, [limits]);
}
