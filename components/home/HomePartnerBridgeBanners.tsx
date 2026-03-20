'use client';

import type { TranslationKey } from '@/lib/i18n';
import type { BridgeSessionRecovery } from '@/hooks/use-bridge-session';

interface Props {
  t: (key: TranslationKey) => string;
  bridgeSessionRecovery: BridgeSessionRecovery;
  onExit: () => void;
}

export function HomePartnerBridgeBanners({ t, bridgeSessionRecovery, onExit }: Props) {
  return (
    <>
      {bridgeSessionRecovery === 'reconnecting' ? (
        <div
          role="status"
          className="shrink-0 px-4 py-2.5 bg-amber-500/12 border-b border-amber-500/35 text-sm text-[var(--app-text-primary)] flex items-center gap-2"
        >
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-amber-500/40 border-t-amber-600" />
          {t('partnerBridgeReconnecting')}
        </div>
      ) : null}
      {bridgeSessionRecovery === 'failed' ? (
        <div
          role="alert"
          className="shrink-0 px-4 py-2.5 bg-red-500/12 border-b border-red-500/35 text-sm text-[var(--app-text-primary)] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{t('partnerBridgeReconnectFailed')}</span>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border border-[var(--app-border)] px-3 py-1.5 text-xs font-medium self-start sm:self-auto"
          >
            {t('partnerModeExit')}
          </button>
        </div>
      ) : null}
    </>
  );
}
