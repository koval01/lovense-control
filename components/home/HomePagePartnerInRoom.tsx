'use client';

import type { RefObject } from 'react';
import type { TranslationKey } from '@/lib/i18n';
import type { LanguageCode, LanguageOption } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';
import type { ConnectionMode } from '@/store/slices/connectionSlice';
import { HomePagePartnerSessionWrapper } from '@/components/home/HomePagePartnerSessionWrapper';
import { partnerActiveToysFromBridge } from '@/components/home/partner-active-toys';

type BridgeSessionReturn = ReturnType<typeof import('@/hooks/use-bridge-session').useBridgeSession>;

interface Props {
  t: (key: TranslationKey) => string;
  themeMode: ThemeMode;
  language: LanguageCode;
  languageOptions: LanguageOption[];
  themeButtonRef: RefObject<HTMLButtonElement | null>;
  languageButtonRef: RefObject<HTMLButtonElement | null>;
  setActiveSheet: (s: 'theme' | 'language' | null) => void;
  setThemeMode: (m: ThemeMode) => void;
  setLanguage: (code: LanguageCode) => void;
  activeSheet: 'theme' | 'language' | null;
  isHeaderVisible: boolean;
  isMobile: boolean;
  chatModalOpen: boolean;
  setChatModalOpen: (v: boolean) => void;
  bridge: BridgeSessionReturn;
  setModeAndHash: (mode: ConnectionMode) => void;
}

export function HomePagePartnerInRoom(p: Props) {
  const partnerStatus =
    p.bridge.status === 'error' ? 'error' : p.bridge.status === 'connecting' ? 'connecting' : 'online';
  const partnerActiveToys = partnerActiveToysFromBridge(p.bridge);
  const partnerControlsFrozen =
    p.bridge.bridgeSessionRecovery !== 'ok' ||
    (p.bridge.partnerEverConnected && !p.bridge.peerConnected);
  const showPartnerDroppedBanner =
    p.bridge.partnerEverConnected &&
    !p.bridge.peerConnected &&
    p.bridge.bridgeSessionRecovery === 'ok' &&
    p.bridge.socketIoConnected;
  return (
    <HomePagePartnerSessionWrapper
      t={p.t}
      themeMode={p.themeMode}
      language={p.language}
      languageOptions={p.languageOptions}
      themeButtonRef={p.themeButtonRef}
      languageButtonRef={p.languageButtonRef}
      setActiveSheet={p.setActiveSheet}
      setThemeMode={p.setThemeMode}
      setLanguage={p.setLanguage}
      activeSheet={p.activeSheet}
      isHeaderVisible={p.isHeaderVisible}
      isMobile={p.isMobile}
      chatModalOpen={p.chatModalOpen}
      setChatModalOpen={p.setChatModalOpen}
      bridge={p.bridge}
      partnerStatus={partnerStatus}
      partnerToys={p.bridge.remoteToys}
      partnerActiveToys={partnerActiveToys}
      partnerControlsFrozen={partnerControlsFrozen}
      showPartnerDroppedBanner={showPartnerDroppedBanner}
      setModeAndHash={p.setModeAndHash}
    />
  );
}
