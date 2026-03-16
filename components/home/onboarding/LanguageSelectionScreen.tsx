'use client';

import { useI18n } from '@/contexts/i18n-context';
import type { LanguageCode } from '@/lib/i18n';
import { OnboardingLayout } from '@/components/home/onboarding/OnboardingLayout';

interface LanguageSelectionScreenProps {
  currentLanguage: LanguageCode;
  onSelect: (language: LanguageCode) => void;
  onSkipAll: () => void;
}

export function LanguageSelectionScreen({
  currentLanguage,
  onSelect,
  onSkipAll,
}: LanguageSelectionScreenProps) {
  const { languageOptions, t } = useI18n();
  const suggestedLanguageName =
    languageOptions.find((option) => option.code === currentLanguage)?.nativeName ?? 'English';

  return (
    <OnboardingLayout title={t('onboardingLanguageTitle')} subtitle={t('onboardingLanguageSubtitle')} onSkipAll={onSkipAll}>
      <div className="space-y-2 mb-5">
        <button
          type="button"
          onClick={() => onSelect(currentLanguage)}
          className="w-full text-left px-4 py-3 rounded-[var(--app-radius-control)] border border-[var(--app-border)] hover:border-[var(--app-accent)] transition-colors bg-[var(--app-surface-soft)]"
        >
          {t('onboardingUseSuggestedLanguage', { language: suggestedLanguageName })}
        </button>
      </div>
      <div className="space-y-2">
        {languageOptions.map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => onSelect(option.code)}
            className="w-full text-left px-4 py-3 rounded-[var(--app-radius-control)] border border-[var(--app-border)] hover:border-[var(--app-accent)] transition-colors"
          >
            {option.nativeName}
          </button>
        ))}
      </div>
    </OnboardingLayout>
  );
}
