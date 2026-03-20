'use client';

import { AnimatePresence } from 'motion/react';
import { StatusErrorView, StatusLoadingView, StatusOnlineView, StatusQrView } from '@/components/status/StatusViews';
import { ToyControlContainer } from '@/components/ToyControlContainer';
import type { Toy } from '@/lib/lovense-domain';
import type { TranslationKey } from '@/lib/i18n';

type Status = 'idle' | 'initializing' | 'connecting' | 'qr_ready' | 'online' | 'error';

type Props = {
  status: Status;
  qrUrl: string | null;
  qrCode: string | null;
  toys: Record<string, Toy>;
  error: string | null;
  sendCommand: (toyId: string, action: string, timeSec?: number) => void;
  activeToyIds: string[];
  activeToys: Record<string, Toy>;
  isPartnerMode?: boolean;
  localToys?: Record<string, Toy>;
  localEnabledToyIds?: string[];
  onToggleToy: (toyId: string) => void;
  onToggleLocalToy?: (toyId: string) => void;
  isLocalToyPolicyToggleFrozen?: (toyId: string) => boolean;
  partnerEnabledToyIds?: string[];
  emptyStateTitleKey?: TranslationKey;
  emptyStateHintKey?: TranslationKey;
  partnerLimits?: Record<string, number>;
  controlsFrozen: boolean;
  errorSecondaryAction?: { label: string; onClick: () => void };
};

export function HomeMainViewBody({
  status,
  qrUrl,
  qrCode,
  toys,
  error,
  sendCommand,
  activeToyIds,
  activeToys,
  isPartnerMode,
  localToys,
  localEnabledToyIds,
  onToggleToy,
  onToggleLocalToy,
  isLocalToyPolicyToggleFrozen,
  partnerEnabledToyIds,
  emptyStateTitleKey,
  emptyStateHintKey,
  partnerLimits,
  controlsFrozen,
  errorSecondaryAction,
}: Props) {
  return (
    <div className={`flex-1 min-h-0 flex flex-col ${status === 'online' ? 'items-stretch md:items-center justify-start pb-0' : 'items-center justify-center pb-10'}`}>
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'initializing' || status === 'connecting' ? <StatusLoadingView /> : null}
        {status === 'error' ? <StatusErrorView error={error} secondaryAction={errorSecondaryAction} /> : null}
        {status === 'qr_ready' ? <StatusQrView qrUrl={qrUrl} qrCode={qrCode} /> : null}
        {status === 'online' ? (
          <StatusOnlineView
            toys={toys}
            activeToyIds={activeToyIds}
            onToggleToy={onToggleToy}
            localToys={isPartnerMode ? localToys : undefined}
            localEnabledToyIds={isPartnerMode ? localEnabledToyIds : undefined}
            onToggleLocalToy={isPartnerMode ? onToggleLocalToy : undefined}
            isLocalToyPolicyToggleFrozen={isPartnerMode ? isLocalToyPolicyToggleFrozen : undefined}
            partnerEnabledToyIds={isPartnerMode ? partnerEnabledToyIds : undefined}
            emptyStateTitleKey={emptyStateTitleKey}
            emptyStateHintKey={emptyStateHintKey}
          >
            <ToyControlContainer
              toys={activeToys}
              onCommand={sendCommand}
              activeToyIds={activeToyIds}
              editableLimitToys={isPartnerMode ? localToys : undefined}
              partnerLimits={isPartnerMode ? partnerLimits : undefined}
              interactive={!controlsFrozen}
            />
          </StatusOnlineView>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
