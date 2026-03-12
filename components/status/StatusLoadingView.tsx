'use client';

import { Spinner } from '@vkontakte/vkui';
import { motion } from 'motion/react';
import { fadeVariants } from '@/constants/animation-variants';
import { useI18n } from '@/contexts/i18n-context';

export function StatusLoadingView() {
  const { t } = useI18n();

  return (
    <motion.div
      key="loading"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="w-20 h-20 flex items-center justify-center mb-6">
        <Spinner size="l" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-[var(--app-text-primary)]">{t('connecting')}</h2>
      <p className="text-[var(--app-text-secondary)]">
        {t('establishingSecureConnection')}
      </p>
    </motion.div>
  );
}
