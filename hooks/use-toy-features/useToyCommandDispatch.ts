import { useRef, useCallback, useMemo } from 'react';
import type { ToyFeature } from '@/lib/lovense-domain';
import { buildActionStringForToy } from '@/lib/command-serialization';

type Params = {
  features: ToyFeature[];
  limits: Record<string, number>;
  onCommand: (toyId: string, action: string, timeSec?: number) => void;
  activeToyIds?: string[];
};

export function useToyCommandDispatch({ features, limits, onCommand, activeToyIds }: Params) {
  const levelsRef = useRef<Record<string, number>>({});
  const lastCommandTime = useRef<Record<string, number>>({});
  const pendingCommand = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  return { levelsRef, sendCommandForToy, flushPendingCommand, pendingCommand };
}
