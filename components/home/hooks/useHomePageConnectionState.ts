import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useLovense } from '@/hooks/use-lovense';
import { useBridgeSession } from '@/hooks/use-bridge-session';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { syncActiveToyIds, toggleToy } from '@/store/slices/selectionSlice';
import type { ConnectionMode } from '@/store/slices/connectionSlice';

export function useHomePageConnectionState(
  isAppReady: boolean,
  mode: ConnectionMode,
  notificationTitle: string
) {
  const dispatch = useAppDispatch();
  const activeToyIds = useAppSelector((state) => state.selection.activeToyIds);
  const limits = useAppSelector((state) => state.control.limits);

  // Bridge socket reuse: if user leaves partner mode but doesn't enter self mode,
  // keep the bridge connection alive for a short grace period.
  const BRIDGE_REUSE_GRACE_MS = 60_000;
  const prevModeRef = useRef<ConnectionMode>(mode);
  const modeRef = useRef<ConnectionMode>(mode);
  const graceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bridgeEnabledEffective, setBridgeEnabledEffective] = useState(
    isAppReady && mode === 'partner'
  );

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!isAppReady) {
      if (graceTimeoutRef.current) clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = null;
      prevModeRef.current = mode;
      setBridgeEnabledEffective(false);
      return;
    }

    if (mode === 'partner') {
      if (graceTimeoutRef.current) clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = null;
      prevModeRef.current = mode;
      setBridgeEnabledEffective(true);
      return;
    }

    if (mode === 'self') {
      if (graceTimeoutRef.current) clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = null;
      prevModeRef.current = mode;
      setBridgeEnabledEffective(false);
      return;
    }

    // mode is "unselected"/other: keep bridge alive only right after partner exit.
    if (prevModeRef.current === 'partner') {
      setBridgeEnabledEffective(true);
      if (graceTimeoutRef.current) clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = setTimeout(() => {
        const currentMode = modeRef.current;
        if (!isAppReady) return;
        if (currentMode !== 'partner' && currentMode !== 'self') {
          setBridgeEnabledEffective(false);
        }
      }, BRIDGE_REUSE_GRACE_MS);
    } else {
      setBridgeEnabledEffective(false);
    }

    prevModeRef.current = mode;
  }, [isAppReady, mode]);

  const bridge = useBridgeSession({
    enabled: isAppReady && bridgeEnabledEffective,
    localToys: {},
    onIncomingCommand: () => {},
    activeToyIds: mode === 'partner' ? activeToyIds : undefined,
    limits: mode === 'partner' ? limits : undefined,
    notificationTitle,
  });
  const lovense = useLovense({ enabled: isAppReady && mode === 'self' });
  const controllableToys = mode === 'partner' ? bridge.remoteToys : lovense.toys;
  useEffect(() => {
    if (mode !== 'self') return;
    dispatch(syncActiveToyIds(Object.keys(controllableToys)));
  }, [controllableToys, dispatch, mode]);
  const handleToggleToy = useCallback((toyId: string) => dispatch(toggleToy(toyId)), [dispatch]);
  const activeToys = useMemo(() => {
    const active = new Set(activeToyIds);
    return Object.fromEntries(Object.entries(controllableToys).filter(([toyId]) => active.has(toyId)));
  }, [activeToyIds, controllableToys]);
  return {
    bridge,
    lovense,
    activeToyIds,
    activeToys,
    handleToggleToy,
  };
}
