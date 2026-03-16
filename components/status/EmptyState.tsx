'use client';

import { Smartphone } from 'lucide-react';
import { useI18n } from '@/contexts/i18n-context';
import type { TranslationKey } from '@/lib/i18n';

export interface EmptyStateProps {
  titleKey?: TranslationKey;
  hintKey?: TranslationKey;
  className?: string;
}

export function EmptyState({
  titleKey = 'noToysFound',
  hintKey = 'emptyStateHint',
  className = '',
}: EmptyStateProps) {
  const { t } = useI18n();

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}>
      <div className="w-20 h-20 bg-[var(--app-surface-soft)] rounded-full flex items-center justify-center mb-6">
        <Smartphone className="w-10 h-10 text-[var(--app-text-secondary)]" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-[var(--app-text-primary)]">{t(titleKey)}</h3>
      <p className="text-[var(--app-text-secondary)] max-w-sm">
        {t(hintKey)}
      </p>
    </div>
  );
}
