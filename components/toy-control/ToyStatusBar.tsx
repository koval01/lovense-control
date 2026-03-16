'use client';

import { useI18n } from '@/contexts/i18n-context';

export interface ToyStatusBarProps {
  toyCount: number;
}

export function ToyStatusBar({ toyCount }: ToyStatusBarProps) {
  const { t } = useI18n();

  return (
    <div className="py-1.5 md:py-3 text-center border-b border-[var(--vkui--color_separator_secondary)] shrink-0">
      <span className="text-xs font-medium text-[var(--vkui--color_text_secondary)]">
        {t('toysConnected', { count: toyCount })}
      </span>
    </div>
  );
}
