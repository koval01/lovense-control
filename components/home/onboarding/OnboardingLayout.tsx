'use client';

import { useI18n } from '@/contexts/i18n-context';

interface OnboardingLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSkipAll: () => void;
}

export function OnboardingLayout({ title, subtitle, children, onSkipAll }: OnboardingLayoutProps) {
  const { t } = useI18n();

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-6 py-8">
      <button
        type="button"
        onClick={onSkipAll}
        className="absolute top-4 right-4 text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] transition-colors"
      >
        {t('onboardingSkipToQr')}
      </button>
      <div className="app-card w-full max-w-3xl rounded-[var(--app-radius-card)] p-6 sm:p-8 mt-6">
        <h1 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-3">{title}</h1>
        <p className="text-sm text-[var(--app-text-secondary)] mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
