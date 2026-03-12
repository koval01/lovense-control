'use client';

import type { Toy } from '@/lib/lovense-domain';
import type { TranslationKey, TranslateOptions } from '@/lib/i18n';

export type DemoStep = {
  targets: string[];
  explanation: string;
  panelView: 'float' | 'limits';
};

export const DEMO_TOYS: Record<string, Toy> = {
  'demo-lush': { id: 'demo-lush', name: 'Lush 3', connected: true, battery: 100, toyType: 'Lush 3' },
  'demo-domi': { id: 'demo-domi', name: 'Domi 2', connected: true, battery: 72, toyType: 'Domi 2' },
};

export function buildDemoSteps(
  t: (
    key: TranslationKey,
    variables?: Record<string, string | number>,
    options?: TranslateOptions
  ) => string
): DemoStep[] {
  return [
    { targets: ['graph'], explanation: t('onboardingDemoStepGraph'), panelView: 'float' },
    { targets: ['float-area', 'graph'], explanation: t('onboardingDemoStepBubble'), panelView: 'float' },
    { targets: ['limits-area'], explanation: t('onboardingDemoStepLimits'), panelView: 'limits' },
    { targets: ['sidebar'], explanation: t('onboardingDemoStepSidebar'), panelView: 'limits' },
  ];
}
