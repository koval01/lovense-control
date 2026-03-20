import { useCallback, type MutableRefObject } from 'react';
import type { ToyFeature } from '@/lib/lovense-domain';

type Params = {
  features: ToyFeature[];
  levelsRef: MutableRefObject<Record<string, number>>;
  sendCommandForToy: (toyId: string, forceZero?: boolean) => void;
  pendingCommand: MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
};

export function useToyPlaybackCommands({ features, levelsRef, sendCommandForToy, pendingCommand }: Params) {
  const applyLevelsAndSend = useCallback(
    (snapshot: Record<string, number>, setLevels: React.Dispatch<React.SetStateAction<Record<string, number>>>) => {
      levelsRef.current = { ...levelsRef.current, ...snapshot };
      setLevels((prev) => ({ ...prev, ...snapshot }));
      const toyIds = Array.from(new Set(features.map((f) => f.toyId)));
      toyIds.forEach((toyId) => sendCommandForToy(toyId, false));
    },
    [features, levelsRef, sendCommandForToy]
  );

  const stopAllFeatures = useCallback(
    (setLevels: React.Dispatch<React.SetStateAction<Record<string, number>>>) => {
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
    },
    [features, levelsRef, pendingCommand, sendCommandForToy]
  );

  return { applyLevelsAndSend, stopAllFeatures };
}
