'use client';

import type { Toy } from '@/lib/lovense-domain';
import type { TranslationKey } from '@/lib/i18n';
import type { ThemeMode } from '@/lib/theme';
import type { RefObject } from 'react';
import { HomeMainView } from '@/components/home/HomeMainView';
import type { HomePartnerBridgeApi } from './home-partner-bridge-api';

interface Props {
  t: (key: TranslationKey) => string;
  themeMode: ThemeMode;
  themeButtonRef: RefObject<HTMLButtonElement | null>;
  languageButtonRef: RefObject<HTMLButtonElement | null>;
  setActiveSheet: (s: 'theme' | 'language' | null) => void;
  isHeaderVisible: boolean;
  bridge: HomePartnerBridgeApi;
  partnerStatus: 'error' | 'connecting' | 'online';
  partnerError: string | null;
  partnerToys: Record<string, Toy>;
  partnerActiveToys: Record<string, Toy>;
  partnerActiveToyIds: string[];
  partnerControlsFrozen: boolean;
  onPartnerExit: () => void;
}

export function HomePartnerSessionMainPanel({
  t,
  themeMode,
  themeButtonRef,
  languageButtonRef,
  setActiveSheet,
  isHeaderVisible,
  bridge,
  partnerStatus,
  partnerError,
  partnerToys,
  partnerActiveToys,
  partnerActiveToyIds,
  partnerControlsFrozen,
  onPartnerExit,
}: Props) {
  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <HomeMainView
        statusData={{
          status: partnerStatus,
          qrUrl: null,
          qrCode: null,
          toys: partnerToys,
          error: partnerError,
          sendCommand: bridge.sendLovenseCommand,
        }}
        activeToyIds={partnerActiveToyIds}
        activeToys={partnerActiveToys}
        localToys={bridge.localToysFromBridge}
        localEnabledToyIds={bridge.localEnabledToyIds}
        partnerEnabledToyIds={bridge.partnerEnabledToyIds}
        partnerLimits={bridge.partnerLimits}
        isPartnerMode
        isHeaderVisible={isHeaderVisible}
        emptyStateTitleKey={
          bridge.peerConnected && Object.keys(partnerToys).length === 0
            ? 'partnerModePartnerNoToys'
            : 'partnerModeWaitingForPartner'
        }
        emptyStateHintKey={
          bridge.peerConnected && Object.keys(partnerToys).length === 0
            ? 'partnerModePartnerNoToysHint'
            : 'partnerModeWaitingForPartnerHint'
        }
        t={t}
        themeMode={themeMode}
        themeButtonRef={themeButtonRef}
        languageButtonRef={languageButtonRef}
        onOpenTheme={() => setActiveSheet('theme')}
        onOpenLanguage={() => setActiveSheet('language')}
        onToggleToy={() => {}}
        onToggleLocalToy={bridge.toggleLocalToyEnabled}
        isLocalToyPolicyToggleFrozen={bridge.isLocalToyPolicyToggleFrozen}
        errorSecondaryAction={{ label: t('partnerModeExit'), onClick: onPartnerExit }}
        controlsFrozen={partnerControlsFrozen}
      />
    </div>
  );
}
