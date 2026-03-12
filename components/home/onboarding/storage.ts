'use client';

export const ONBOARDING_STORAGE_KEY = 'lovense-control-onboarding-stage-v1';

export type OnboardingStage = 'language' | 'theme' | 'demo' | 'complete';

export function loadOnboardingStage(): OnboardingStage | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    if (raw === 'language' || raw === 'theme' || raw === 'demo' || raw === 'complete') {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveOnboardingStage(stage: OnboardingStage) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, stage);
  } catch {
    // Ignore storage errors and keep in-memory flow.
  }
}
