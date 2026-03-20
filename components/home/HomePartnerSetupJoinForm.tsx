'use client';

import { PAIR_CODE_LENGTH } from '@/hooks/use-bridge-session';
import type { TranslationKey } from '@/lib/i18n';
import type { ConnectionMode } from '@/store/slices/connectionSlice';

interface Props {
  t: (key: TranslationKey) => string;
  pairCodeInput: string;
  setPairCodeInput: (v: string) => void;
  selfSessionReady: boolean;
  bridgeError: string | null;
  joinRoom: (code: string) => Promise<void>;
  createRoom: () => Promise<void>;
  setModeAndHash: (mode: ConnectionMode) => void;
}

export function HomePartnerSetupJoinForm({
  t,
  pairCodeInput,
  setPairCodeInput,
  selfSessionReady,
  bridgeError,
  joinRoom,
  createRoom,
  setModeAndHash,
}: Props) {
  return (
    <>
      <p className="mt-2 text-sm text-[var(--app-text-secondary)]">{t('partnerModeDescription')}</p>
      <div className="mt-4">
        <label className="block text-sm font-medium text-[var(--app-text)] mb-1">{t('partnerModeJoinLabel')}</label>
        <input
          value={pairCodeInput}
          onChange={(event) => {
            const alphanumeric = event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, PAIR_CODE_LENGTH);
            setPairCodeInput(alphanumeric);
          }}
          inputMode="text"
          autoComplete="one-time-code"
          className="w-full h-11 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 text-base tracking-[0.2em] text-[var(--app-text)] font-mono"
          placeholder={t('partnerModeJoinPlaceholder')}
        />
        <button
          type="button"
          onClick={() => void joinRoom(pairCodeInput.trim())}
          disabled={pairCodeInput.trim().length !== PAIR_CODE_LENGTH || !selfSessionReady}
          className="mt-3 w-full rounded-xl bg-[var(--app-accent)] text-white px-4 py-2.5 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[var(--app-surface-soft)] disabled:text-[var(--app-text-secondary)] disabled:border disabled:border-[var(--app-border)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {t('partnerModeJoinButton')}
        </button>
        {!selfSessionReady && (
          <p className="mt-2 text-xs text-[var(--app-text-secondary)]">{t('partnerModeJoinRequireConnection')}</p>
        )}
      </div>
      <div className="mt-6 pt-4 border-t border-[var(--app-border)]">
        <p className="text-xs text-[var(--app-text-secondary)] mb-3">{t('partnerModeCreateCodeHint')}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void createRoom()}
            disabled={!selfSessionReady}
            className="rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-bg)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {t('partnerModeCreateCode')}
          </button>
          <button
            type="button"
            onClick={() => setModeAndHash('unselected')}
            className="rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-bg)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {t('partnerModeBack')}
          </button>
        </div>
      </div>
      {bridgeError ? <p className="mt-4 text-sm text-red-500">{bridgeError}</p> : null}
    </>
  );
}
