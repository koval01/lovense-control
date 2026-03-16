/**
 * Domain types for Lovense toys and control UI.
 */

import type { LucideIcon } from 'lucide-react';

/** Connected toy as reported by the Lovense API. */
export type Toy = {
  id: string;
  name: string;
  connected: boolean;
  battery: number;
  toyType?: string;
  /** Functions reported by Lovense for this concrete toy (e.g. Vibrate, Rotate). */
  supportedFunctions?: string[];
};

/** Control mode: float (drag bubbles) or traditional (sliders). */
export type ControlMode = 'float' | 'traditional';

/** UI representation of a single toy feature (e.g. Vibrate, Rotate). */
export interface ToyFeature {
  /** Composite id: toyId:featureName */
  id: string;
  toyId: string;
  toyName: string;
  featureName: string;
  maxLevel: number;
  color: string;
  icon: LucideIcon;
}

/** Position of a bubble in the float-mode canvas. */
export interface BubblePosition {
  x: number;
  y: number;
}

/** Group of features controlled together (merged bubbles). */
export interface FeatureGroup {
  id: string;
  featureIds: string[];
  name: string;
  color: string;
}
