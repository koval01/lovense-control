'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeVariants } from '@/constants/animation-variants';
import { useI18n } from '@/contexts/i18n-context';

export interface StatusErrorViewProps {
  error: string | null;
  /** Optional secondary action (e.g. "Exit partner mode"). */
  secondaryAction?: { label: string; onClick: () => void };
}

export function StatusErrorView({ error, secondaryAction }: StatusErrorViewProps) {
  const { t } = useI18n();

  return (
    <motion.div
      key="error"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto"
    >
      <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400" />
      </div>
      <h2 className="text-2xl font-semibold mb-3 text-[var(--app-text-primary)]">
        {t('connectionFailed')}
      </h2>
      <p className="text-[var(--app-text-secondary)] mb-8 leading-relaxed">
        {error || t('defaultConnectionError')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.location.reload()}
          className="app-button-primary flex items-center justify-center gap-2 h-12 px-6 rounded-[var(--app-radius-control)] font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" /> {t('tryAgain')}
        </button>
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="flex items-center justify-center h-12 px-6 rounded-[var(--app-radius-control)] border border-[var(--app-border)] font-medium text-[var(--app-text-primary)] hover:bg-[var(--app-bg-elevated)] transition-colors cursor-pointer"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}
