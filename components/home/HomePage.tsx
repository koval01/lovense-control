'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLovense } from '@/hooks/use-lovense';
import { useI18n } from '@/contexts/i18n-context';
import { useTheme } from '@/contexts/theme-context';
import { SplashScreen } from '@/components/home/SplashScreen';
import { useOnboardingFlow } from '@/components/home/hooks/useOnboardingFlow';
import { useSplashState } from '@/components/home/hooks/useSplashState';
import { HomeOnboardingView } from '@/components/home/HomeOnboardingView';
import { HomeMainView } from '@/components/home/HomeMainView';
import { HomeActionSheet } from '@/components/home/HomeActionSheet';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { syncActiveToyIds, toggleToy } from '@/store/slices/selectionSlice';

export function HomePage() {
  const dispatch = useAppDispatch();
  const { t, language, languageOptions, setLanguage, hasSelectedLanguage, isReady } = useI18n();
  const { themeMode, setThemeMode } = useTheme();
  const onboarding = useOnboardingFlow({
    isReady,
    hasSelectedLanguage,
    language,
    setLanguage,
    setThemeMode,
  });
  const { status, qrUrl, toys, error, sendCommand } = useLovense({
    enabled: isReady && onboarding.isOnboardingReady && onboarding.isOnboardingComplete,
  });
  const activeToyIds = useAppSelector((state) => state.selection.activeToyIds);
  useEffect(() => {
    dispatch(syncActiveToyIds(Object.keys(toys)));
  }, [dispatch, toys]);
  const handleToggleToy = useCallback(
    (toyId: string) => {
      dispatch(toggleToy(toyId));
    },
    [dispatch]
  );
  const activeToys = useMemo(() => {
    const active = new Set(activeToyIds);
    return Object.fromEntries(Object.entries(toys).filter(([toyId]) => active.has(toyId)));
  }, [activeToyIds, toys]);
  const { shouldShowSplash, isHeaderVisible } = useSplashState(isReady && onboarding.isOnboardingReady);
  const [activeSheet, setActiveSheet] = useState<'theme' | 'language' | null>(null);
  const themeButtonRef = useRef<HTMLButtonElement | null>(null);
  const languageButtonRef = useRef<HTMLButtonElement | null>(null);

  if (shouldShowSplash) {
    return <SplashScreen />;
  }

  if (!isReady || !onboarding.isOnboardingReady) {
    return (
      <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)] flex items-center justify-center">
        <span className="text-[var(--app-text-secondary)]">{t('loading')}</span>
      </div>
    );
  }

  if (!onboarding.isOnboardingComplete) {
    return (
      <HomeOnboardingView
        onboardingStage={onboarding.onboardingStage}
        language={language}
        themeMode={themeMode}
        completeLanguageStep={onboarding.completeLanguageStep}
        setThemeMode={setThemeMode}
        setOnboardingStage={onboarding.setOnboardingStage}
        handleSkipAll={onboarding.handleSkipAll}
      />
    );
  }

  return (
    <>
      <HomeMainView
        statusData={{ status, qrUrl, toys, error, sendCommand }}
        activeToyIds={activeToyIds}
        activeToys={activeToys}
        isHeaderVisible={isHeaderVisible}
        t={t}
        themeMode={themeMode}
        themeButtonRef={themeButtonRef}
        languageButtonRef={languageButtonRef}
        onOpenTheme={() => setActiveSheet('theme')}
        onOpenLanguage={() => setActiveSheet('language')}
        onToggleToy={handleToggleToy}
      />
      <HomeActionSheet
        activeSheet={activeSheet}
        themeMode={themeMode}
        language={language}
        languageOptions={languageOptions}
        themeButtonRef={themeButtonRef}
        languageButtonRef={languageButtonRef}
        t={t}
        setThemeMode={setThemeMode}
        setLanguage={setLanguage}
        setActiveSheet={setActiveSheet}
      />
    </>
  );
}
