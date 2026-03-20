'use client';

import { StatusQrView } from '@/components/status/StatusQrView';
import type { TranslationKey } from '@/lib/i18n';
import type { ConnectionMode } from '@/store/slices/connectionSlice';

interface Props {
  t: (key: TranslationKey) => string;
  selfQrUrl: string | null;
  selfQrCode: string | null;
  error: string | null;
  setModeAndHash: (mode: ConnectionMode) => void;
}

export function HomePartnerSetupQrPhase({ t, selfQrUrl, selfQrCode, error, setModeAndHash }: Props) {
  return (
    <>
      <p className="mt-2 text-sm text-[var(--app-text-secondary)]">{t('partnerModeQrPhaseIntro')}</p>
      <p className="mt-3 text-sm text-[var(--app-text-secondary)]">{t('partnerModeScanHereOrSelf')}</p>
      {selfQrUrl || selfQrCode ? (
        <div className="my-6">
          <StatusQrView qrUrl={selfQrUrl} qrCode={selfQrCode} compact />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--app-text-secondary)]">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-[var(--app-accent)]" />
          {t('partnerModeConnectingToys')}
        </div>
      )}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setModeAndHash('unselected')}
          className="rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-bg)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {t('partnerModeBack')}
        </button>
      </div>
    </>
  );
}
