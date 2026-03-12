'use client';

import { useCallback, useEffect, useMemo } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { syncActiveToyIds, toggleToy } from '@/store/slices/selectionSlice';

export function useActiveToys(toys: Record<string, Toy>) {
  const dispatch = useAppDispatch();
  const activeToyIds = useAppSelector((state) => state.selection.activeToyIds);

  useEffect(() => {
    dispatch(syncActiveToyIds(Object.keys(toys)));
  }, [dispatch, toys]);

  const handleToggleToy = useCallback((toyId: string) => {
    dispatch(toggleToy(toyId));
  }, [dispatch]);

  const activeToys = useMemo(() => {
    const active = new Set(activeToyIds);
    return Object.fromEntries(Object.entries(toys).filter(([toyId]) => active.has(toyId)));
  }, [toys, activeToyIds]);

  return { activeToyIds, activeToys, handleToggleToy };
}
