'use client';

import { Spinner } from '@vkontakte/vkui';
import { motion, AnimatePresence } from 'motion/react';
import { fadeVariants } from '@/constants/animation-variants';
import { useI18n } from '@/contexts/i18n-context';
import { StatusQrSkeleton } from './StatusQrSkeleton';
import { useStatusQrEffects } from './useStatusQrEffects';

export interface StatusQrViewProps {
  qrUrl: string | null;
  qrCode?: string | null;
  compact?: boolean;
}

export function StatusQrView({ qrUrl, qrCode, compact = false }: StatusQrViewProps) {
  const { t } = useI18n();
  const { imageLoaded, qrReady, qrContainerRef, qrSize } = useStatusQrEffects(qrUrl, qrCode);

  const useSvg = Boolean(qrCode);
  const useImage = !qrCode && qrUrl;
  const showSkeleton = (qrCode && !qrReady) || (useImage && !imageLoaded);

  return (
    <motion.div
      key="qr"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`flex flex-col items-center justify-center text-center max-w-md mx-auto w-full ${compact ? 'px-0' : 'px-6'}`}
    >
      <h2
        className={
          compact
            ? 'text-base font-medium mb-2 tracking-tight text-[var(--app-text-secondary)]'
            : 'text-3xl font-semibold mb-3 tracking-tight text-[var(--app-text-primary)]'
        }
      >
        {t('pairDevice')}
      </h2>
      <p
        className={
          compact
            ? 'text-sm text-[var(--app-text-secondary)] mb-4 leading-relaxed'
            : 'text-[var(--app-text-secondary)] mb-10 leading-relaxed'
        }
      >
        {t('qrInstruction')}
      </p>
      <div className="relative" style={{ width: qrSize, height: qrSize, marginBottom: compact ? 16 : 32 }}>
        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <StatusQrSkeleton />
            </motion.div>
          ) : null}
        </AnimatePresence>
        {useSvg ? (
          <motion.div
            role="img"
            aria-label={t('lovenseQrCodeAlt')}
            initial={{ opacity: 0 }}
            animate={{ opacity: qrReady ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="status-qr-svg absolute inset-0 flex items-center justify-center overflow-hidden [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <div ref={qrContainerRef} className="absolute inset-0 [&_svg]:w-full [&_svg]:h-full" />
          </motion.div>
        ) : useImage && qrUrl ? (
          <motion.div
            role="img"
            aria-label={t('lovenseQrCodeAlt')}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 rounded-2xl dark:invert"
            style={{
              backgroundImage: `url("${qrUrl}")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          />
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-sm font-medium text-[var(--app-text-secondary)] bg-[var(--app-bg-elevated)] border border-[var(--app-border)] px-6 py-3 rounded-full whitespace-nowrap shadow-[var(--app-shadow)]"><Spinner size="m" /><span>{t('waitingForAppConnection')}</span></div>
    </motion.div>
  );
}
