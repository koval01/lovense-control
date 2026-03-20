'use client';

import type { TranslationKey } from '@/lib/i18n';
import type { ConnectionMode } from '@/store/slices/connectionSlice';
import type { BridgeSessionRecovery } from '@/hooks/use-bridge-session';

interface Props {
  t: (key: TranslationKey) => string;
  setupRecovery: BridgeSessionRecovery;
  setModeAndHash: (mode: ConnectionMode) => void;
}

export function HomePartnerSetupRecovery({ t, setupRecovery, setModeAndHash }: Props) {
  if (setupRecovery === 'reconnecting') {
    return (
      <div className="mt-6 flex flex-col items-stretch gap-4" role="status" aria-busy="true">
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-5 flex flex-col items-center gap-3 text-center">
          <span className="inline-block h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-amber-500/40 border-t-amber-600" />
          <p className="text-sm text-[var(--app-text-primary)]">{t('partnerBridgePreflightReconnecting')}</p>
        </div>
        <button
          type="button"
          onClick={() => setModeAndHash('unselected')}
          className="rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-bg)] transition-colors"
        >
          {t('partnerModeBack')}
        </button>
      </div>
    );
  }
  if (setupRecovery === 'failed') {
    return (
      <div className="mt-6 flex flex-col items-stretch gap-4" role="alert">
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-4 text-sm text-[var(--app-text-primary)]">
          {t('partnerBridgeReconnectFailed')}
        </div>
        <button
          type="button"
          onClick={() => setModeAndHash('unselected')}
          className="rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-bg)] transition-colors"
        >
          {t('partnerModeBack')}
        </button>
      </div>
    );
  }
  return null;
}
