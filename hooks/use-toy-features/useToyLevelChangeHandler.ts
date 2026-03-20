import { useCallback, type MutableRefObject } from 'react';
import type { ToyFeature } from '@/lib/lovense-domain';

type Params = {
  features: ToyFeature[];
  isLooping: boolean;
  levelsRef: MutableRefObject<Record<string, number>>;
  sendCommandForToy: (toyId: string, forceZero?: boolean) => void;
  setLevels: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

export function useToyLevelChangeHandler({
  features,
  isLooping,
  levelsRef,
  sendCommandForToy,
  setLevels,
}: Params) {
  return useCallback(
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
    [features, isLooping, sendCommandForToy, levelsRef, setLevels]
  );
}
