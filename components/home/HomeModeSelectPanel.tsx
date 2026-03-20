'use client';

import type { TranslationKey } from '@/lib/i18n';
import type { ConnectionMode } from '@/store/slices/connectionSlice';

interface Props {
  t: (key: TranslationKey) => string;
  isBridgeAvailable: boolean;
  setModeAndHash: (mode: ConnectionMode) => void;
}

export function HomeModeSelectPanel({ t, isBridgeAvailable, setModeAndHash }: Props) {
  return (
    <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-5">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-5 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-[var(--app-text)]">{t('controlModeTitle')}</h1>
        <p className="mt-2 text-sm text-[var(--app-text-secondary)]">{t('controlModeSubtitle')}</p>
        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={() => setModeAndHash('self')}
            className="rounded-xl border border-[var(--app-border)] p-4 text-left hover:bg-[var(--app-bg)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="font-medium text-[var(--app-text)]">{t('controlModeSelfTitle')}</div>
            <div className="mt-1 text-sm text-[var(--app-text-secondary)]">{t('controlModeSelfDescription')}</div>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isBridgeAvailable) setModeAndHash('partner');
            }}
            disabled={!isBridgeAvailable}
            className="rounded-xl border border-[var(--app-border)] p-4 text-left transition-colors transition-transform disabled:opacity-50 hover:bg-[var(--app-bg)] disabled:hover:bg-[var(--app-bg-elevated)] hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="font-medium text-[var(--app-text)]">{t('controlModePartnerTitle')}</div>
            <div className="mt-1 text-sm text-[var(--app-text-secondary)]">
              {t('controlModePartnerDescription')}{' '}
              {!isBridgeAvailable ? t('controlModePartnerUnavailableSuffix') : ''}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
