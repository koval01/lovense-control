import type { Toy, ToyFeature } from './types';
import { FEATURE_MAX_LEVELS } from './constants';
import { getFeatureColorByIndex, getFeatureIcon } from './feature-colors-icons';
import { getFeaturesForToy } from './feature-list-by-toy-type';

/** Builds the full list of ToyFeature entries from connected toys. */
export function buildToyFeatures(toys: Record<string, Toy>): ToyFeature[] {
  const list: ToyFeature[] = [];
  Object.values(toys).forEach((toy) => {
    const toyFeatures = getFeaturesForToy(toy.toyType || toy.name, toy.supportedFunctions);
    toyFeatures.forEach((featureName, index) => {
      const baseName = featureName.replace(/\d+$/, '');
      const maxLevel = FEATURE_MAX_LEVELS[baseName] ?? 20;
      list.push({
        id: `${toy.id}:${featureName}`,
        toyId: toy.id,
        toyName: toy.name,
        featureName,
        maxLevel,
        color: getFeatureColorByIndex(index),
        icon: getFeatureIcon(featureName),
      });
    });
  });
  return list;
}
