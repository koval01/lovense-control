'use client';

import type { RefObject } from 'react';
import type { TranslationKey } from '@/lib/i18n';
import type { LanguageCode, LanguageOption } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';
import { HomePartnerSessionView } from '@/components/home/HomePartnerSessionView';
import { useToast } from '@/contexts/toast-context';
import type { ConnectionMode } from '@/store/slices/connectionSlice';

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
  partnerStatus: 'error' | 'connecting' | 'online';
  partnerToys: Record<string, import('@/lib/lovense-domain').Toy>;
  partnerActiveToys: Record<string, import('@/lib/lovense-domain').Toy>;
  partnerControlsFrozen: boolean;
  showPartnerDroppedBanner: boolean;
  setModeAndHash: (mode: ConnectionMode) => void;
}

export function HomePagePartnerSessionWrapper(props: Props) {
  const {
    t,
    themeMode,
    language,
    languageOptions,
    themeButtonRef,
    languageButtonRef,
    setActiveSheet,
    setThemeMode,
    setLanguage,
    activeSheet,
    isHeaderVisible,
    isMobile,
    chatModalOpen,
    setChatModalOpen,
    bridge,
    partnerStatus,
    partnerToys,
    partnerActiveToys,
    partnerControlsFrozen,
    showPartnerDroppedBanner,
    setModeAndHash,
  } = props;
  const toast = useToast();
  return (
    <HomePartnerSessionView
      t={t}
      themeMode={themeMode}
      language={language}
      languageOptions={languageOptions}
      themeButtonRef={themeButtonRef}
      languageButtonRef={languageButtonRef}
      setActiveSheet={setActiveSheet}
      setThemeMode={setThemeMode}
      setLanguage={setLanguage}
      activeSheet={activeSheet}
      isHeaderVisible={isHeaderVisible}
      isMobile={isMobile}
      chatModalOpen={chatModalOpen}
      setChatModalOpen={setChatModalOpen}
      bridge={bridge}
      partnerStatus={partnerStatus}
      partnerError={bridge.error}
      partnerToys={partnerToys}
      partnerActiveToys={partnerActiveToys}
      partnerActiveToyIds={Object.keys(partnerActiveToys)}
      partnerControlsFrozen={partnerControlsFrozen}
      showPartnerDroppedBanner={showPartnerDroppedBanner}
      onCopyPairCode={async () => {
        await navigator.clipboard.writeText(bridge.pairCode || '');
        toast(t('partnerModeCodeCopied'));
      }}
      onPartnerExit={() => {
        setModeAndHash('unselected');
      }}
    />
  );
}
