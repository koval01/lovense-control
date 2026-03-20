'use client';

import type { TranslationKey } from '@/lib/i18n';
import type { BridgeStatus } from '@/hooks/bridge-session/types';

interface Props {
  t: (key: TranslationKey) => string;
  bridgeStatus: BridgeStatus;
  isHost: boolean;
  peerConnected: boolean;
  pairCode: string | null;
  rttMs: number | null;
  showPartnerDroppedBanner: boolean;
  onCopyCode: () => void | Promise<void>;
  onExit: () => void;
}

export function HomePartnerTopBar({
  t,
  bridgeStatus,
  isHost,
  peerConnected,
  pairCode,
  rttMs,
  showPartnerDroppedBanner,
  onCopyCode,
  onExit,
}: Props) {
  if (bridgeStatus === 'error') return null;
  return (
    <div className="shrink-0 px-4 pt-3 pb-2 bg-[var(--app-bg)] border-b border-[var(--app-border)] flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:gap-y-0">
      <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
        {isHost && !peerConnected && pairCode ? (
          <>
            <span className="text-xs md:text-sm text-[var(--app-text-secondary)] basis-full sm:basis-auto">
              {t('partnerModeShareCode')}
            </span>
            <button
              type="button"
              onClick={() => void onCopyCode()}
              className="rounded-[var(--app-radius-control)] border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold tracking-[0.2em] hover:bg-[var(--app-bg-elevated)] transition-colors cursor-pointer min-w-[7.5rem] touch-manipulation"
              title={t('partnerModeCopyCode')}
            >
              {pairCode}
            </button>
          </>
        ) : null}
        {peerConnected ? (
          <span className="text-xs text-[var(--app-text-secondary)]">
            {t('partnerModeConnected')}
            {rttMs != null ? ` · ${rttMs} ms` : ''}
          </span>
        ) : showPartnerDroppedBanner ? (
          <span className="text-xs text-amber-700 dark:text-amber-300">{t('partnerBridgePartnerDisconnectedWaiting')}</span>
        ) : bridgeStatus === 'online' || bridgeStatus === 'waiting_partner' ? (
          <span className="text-xs text-[var(--app-text-secondary)]">{t('partnerModeWaitingForPartner')}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onExit}
        className="self-end sm:self-center rounded-[var(--app-radius-control)] border border-[var(--app-border)] px-3 py-2 text-xs sm:ml-auto sm:py-1 touch-manipulation"
      >
        {t('partnerModeExit')}
      </button>
    </div>
  );
}
