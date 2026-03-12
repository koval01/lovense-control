'use client';

import { useI18n } from '@/contexts/i18n-context';
import type { ThemeMode } from '@/lib/theme';
import { OnboardingLayout } from '@/components/home/onboarding/OnboardingLayout';

interface ThemeSelectionScreenProps {
  currentThemeMode: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
  onContinue: () => void;
  onSkipAll: () => void;
}

export function ThemeSelectionScreen({
  currentThemeMode,
  onSelect,
  onContinue,
  onSkipAll,
}: ThemeSelectionScreenProps) {
  const { t } = useI18n();
  const options: Array<{ mode: ThemeMode; label: string; description: string }> = [
    { mode: 'auto', label: t('themeAuto'), description: t('onboardingThemeAutoDescription') },
    { mode: 'light', label: t('themeLight'), description: t('onboardingThemeLightDescription') },
    { mode: 'dark', label: t('themeDark'), description: t('onboardingThemeDarkDescription') },
  ];

  return (
    <OnboardingLayout title={t('onboardingThemeTitle')} subtitle={t('onboardingThemeSubtitle')} onSkipAll={onSkipAll}>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.mode}
            type="button"
            onClick={() => onSelect(option.mode)}
            className={`w-full text-left px-4 py-3 rounded-[var(--app-radius-control)] border transition-colors ${
              currentThemeMode === option.mode
                ? 'border-[var(--app-accent)] bg-[var(--app-surface-soft)]'
                : 'border-[var(--app-border)] hover:border-[var(--app-accent)]'
            }`}
          >
            <div className="text-sm font-medium text-[var(--app-text-primary)]">{option.label}</div>
            <div className="text-xs text-[var(--app-text-secondary)]">{option.description}</div>
          </button>
        ))}
      </div>
      <button type="button" onClick={onContinue} className="app-button-primary mt-6 w-full h-11 rounded-[var(--app-radius-control)] text-sm font-medium">
        {t('continue')}
      </button>
    </OnboardingLayout>
  );
}
