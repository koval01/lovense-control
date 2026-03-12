'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@vkontakte/vkui';
import { motion, AnimatePresence } from 'motion/react';
import { fadeVariants } from '@/constants/animation-variants';
import { useI18n } from '@/contexts/i18n-context';

const QR_SIZE = 240;

export interface StatusQrViewProps {
  qrUrl: string | null;
}

function QrSkeleton() {
  return <div className="qr-skeleton w-full h-full rounded-2xl" aria-hidden />;
}

export function StatusQrView({ qrUrl }: StatusQrViewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setImageLoaded(false);
    if (!qrUrl) return;

    const preloader = new window.Image();
    preloader.referrerPolicy = 'no-referrer';
    preloader.onload = () => setImageLoaded(true);
    preloader.onerror = () => setImageLoaded(false);
    preloader.src = qrUrl;
  }, [qrUrl]);

  const showSkeleton = !qrUrl || !imageLoaded;

  return (
    <motion.div
      key="qr"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto w-full"
    >
      <h2 className="text-3xl font-semibold mb-3 tracking-tight text-[var(--app-text-primary)]">
        {t('pairDevice')}
      </h2>
      <p className="text-[var(--app-text-secondary)] mb-10 leading-relaxed">
        {t('qrInstruction')}
      </p>
      <div
        className="relative mb-8"
        style={{ width: QR_SIZE, height: QR_SIZE }}
      >
        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <QrSkeleton />
            </motion.div>
          ) : null}
        </AnimatePresence>
        {qrUrl ? (
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
      <div className="flex items-center gap-3 text-sm font-medium text-[var(--app-text-secondary)] bg-[var(--app-bg-elevated)] border border-[var(--app-border)] px-6 py-3 rounded-full whitespace-nowrap shadow-[var(--app-shadow)]">
        <Spinner size="m" /> <span>{t('waitingForAppConnection')}</span>
      </div>
    </motion.div>
  );
}
