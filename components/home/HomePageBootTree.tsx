'use client';

import type { ReactNode } from 'react';
import { AppLoadingSkeleton } from '@/components/home/AppLoadingSkeleton';
import { SplashScreen } from '@/components/home/SplashScreen';
import { HomeOnboardingView } from '@/components/home/HomeOnboardingView';
import type { OnboardingStage } from '@/components/home/onboarding/storage';
import type { LanguageCode } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';

interface OnboardingApi {
  onboardingStage: OnboardingStage;
  completeLanguageStep: (nextLanguage: LanguageCode) => void;
  setOnboardingStage: (s: OnboardingStage) => void;
  handleSkipAll: () => void;
  isOnboardingReady: boolean;
  isOnboardingComplete: boolean;
}

export function homePageBootTree(
  shouldShowSplash: boolean,
  isReady: boolean,
  onboarding: OnboardingApi,
  language: LanguageCode,
  themeMode: ThemeMode,
  setThemeMode: (m: ThemeMode) => void
): { key: string; node: ReactNode } | null {
  if (shouldShowSplash) return { key: 'splash', node: <SplashScreen /> };
  if (!isReady || !onboarding.isOnboardingReady) return { key: 'app-loading', node: <AppLoadingSkeleton /> };
  if (!onboarding.isOnboardingComplete) {
    return {
      key: 'onboarding',
      node: (
        <HomeOnboardingView
          onboardingStage={onboarding.onboardingStage}
          language={language}
          themeMode={themeMode}
          completeLanguageStep={onboarding.completeLanguageStep}
          setThemeMode={setThemeMode}
          setOnboardingStage={onboarding.setOnboardingStage}
          handleSkipAll={onboarding.handleSkipAll}
        />
      ),
    };
  }
  return null;
}
