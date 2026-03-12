'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { LanguageCode } from '@/lib/i18n';
import type { ThemeMode } from '@/lib/theme';
import {
  DemoControlScreen,
  LanguageSelectionScreen,
  ThemeSelectionScreen,
} from '@/components/home/onboarding/OnboardingScreens';
import type { OnboardingStage } from '@/components/home/onboarding/storage';

interface HomeOnboardingViewProps {
  onboardingStage: OnboardingStage;
  language: LanguageCode;
  themeMode: ThemeMode;
  completeLanguageStep: (language: LanguageCode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setOnboardingStage: (stage: OnboardingStage) => void;
  handleSkipAll: () => void;
}

export function HomeOnboardingView({
  onboardingStage,
  language,
  themeMode,
  completeLanguageStep,
  setThemeMode,
  setOnboardingStage,
  handleSkipAll,
}: HomeOnboardingViewProps) {
  return (
    <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={onboardingStage}
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {onboardingStage === 'language' ? (
            <LanguageSelectionScreen currentLanguage={language} onSelect={completeLanguageStep} onSkipAll={handleSkipAll} />
          ) : onboardingStage === 'theme' ? (
            <ThemeSelectionScreen
              currentThemeMode={themeMode}
              onSelect={setThemeMode}
              onContinue={() => setOnboardingStage('demo')}
              onSkipAll={handleSkipAll}
            />
          ) : (
            <DemoControlScreen onContinue={() => setOnboardingStage('complete')} onSkipAll={handleSkipAll} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
