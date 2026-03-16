'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { LanguageCode } from '@/lib/i18n';
import type { ThemeMode } from '@/lib/theme';
import { loadOnboardingStage, OnboardingStage, saveOnboardingStage } from '@/components/home/onboarding/storage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  initializeOnboarding,
  setOnboardingStage as setOnboardingStageAction,
} from '@/store/slices/onboardingSlice';

interface UseOnboardingFlowParams {
  isReady: boolean;
  hasSelectedLanguage: boolean;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export function useOnboardingFlow({
  isReady,
  hasSelectedLanguage,
  language,
  setLanguage,
  setThemeMode,
}: UseOnboardingFlowParams) {
  const dispatch = useAppDispatch();
  const { onboardingStage, isOnboardingReady } = useAppSelector((state) => state.onboarding);
  const hasInitializedOnboardingRef = useRef(false);
  const isOnboardingComplete = onboardingStage === 'complete';

  useEffect(() => {
    if (!isReady || hasInitializedOnboardingRef.current) return;
    hasInitializedOnboardingRef.current = true;
    const savedStage = loadOnboardingStage();
    if (savedStage) {
      dispatch(initializeOnboarding(savedStage));
      return;
    }
    dispatch(initializeOnboarding(hasSelectedLanguage ? 'theme' : 'language'));
  }, [dispatch, hasSelectedLanguage, isReady]);

  useEffect(() => {
    if (isOnboardingReady) saveOnboardingStage(onboardingStage);
  }, [isOnboardingReady, onboardingStage]);

  const completeLanguageStep = useCallback((nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage);
    dispatch(setOnboardingStageAction('theme'));
  }, [dispatch, setLanguage]);

  const handleSkipAll = useCallback(() => {
    if (!hasSelectedLanguage) setLanguage(language);
    setThemeMode('auto');
    dispatch(setOnboardingStageAction('complete'));
  }, [dispatch, hasSelectedLanguage, language, setLanguage, setThemeMode]);

  const setOnboardingStage = useCallback(
    (stage: OnboardingStage) => {
      dispatch(setOnboardingStageAction(stage));
    },
    [dispatch]
  );

  return {
    onboardingStage,
    isOnboardingReady,
    isOnboardingComplete,
    setOnboardingStage,
    completeLanguageStep,
    handleSkipAll,
  };
}
