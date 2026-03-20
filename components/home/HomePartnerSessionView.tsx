'use client';

import { HomeActionSheet } from '@/components/home/HomeActionSheet';
import { HomePartnerBridgeBanners } from '@/components/home/HomePartnerBridgeBanners';
import { HomePartnerTopBar } from '@/components/home/HomePartnerTopBar';
import { HomePartnerSessionMainPanel } from '@/components/home/HomePartnerSessionMainPanel';
import { HomePartnerSessionChatArea } from '@/components/home/HomePartnerSessionChatArea';
import type { HomePartnerSessionViewProps } from '@/components/home/home-partner-session-view-props';

export type { HomePartnerBridgeApi } from '@/components/home/home-partner-bridge-api';

export function HomePartnerSessionView(props: HomePartnerSessionViewProps) {
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
    partnerError,
    partnerToys,
    partnerActiveToys,
    partnerActiveToyIds,
    partnerControlsFrozen,
    showPartnerDroppedBanner,
    onCopyPairCode,
    onPartnerExit,
  } = props;
  const chatOk =
    bridge.bridgeSessionRecovery === 'ok' && (bridge.status === 'online' || bridge.status === 'waiting_partner');
  return (
    <div className="flex flex-col h-full min-h-0 app-min-h-viewport">
      <HomePartnerBridgeBanners
        t={t}
        bridgeSessionRecovery={bridge.bridgeSessionRecovery}
        onExit={onPartnerExit}
      />
      <HomePartnerTopBar
        t={t}
        bridgeStatus={bridge.status}
        isHost={bridge.isHost}
        peerConnected={bridge.peerConnected}
        pairCode={bridge.pairCode}
        rttMs={bridge.rttMs}
        showPartnerDroppedBanner={showPartnerDroppedBanner}
        onCopyCode={onCopyPairCode}
        onExit={onPartnerExit}
      />
      <HomePartnerSessionMainPanel
        t={t}
        themeMode={themeMode}
        themeButtonRef={themeButtonRef}
        languageButtonRef={languageButtonRef}
        setActiveSheet={setActiveSheet}
        isHeaderVisible={isHeaderVisible}
        bridge={bridge}
        partnerStatus={partnerStatus}
        partnerError={partnerError}
        partnerToys={partnerToys}
        partnerActiveToys={partnerActiveToys}
        partnerActiveToyIds={partnerActiveToyIds}
        partnerControlsFrozen={partnerControlsFrozen}
        onPartnerExit={onPartnerExit}
      />
      <HomePartnerSessionChatArea
        t={t}
        isMobile={isMobile}
        chatModalOpen={chatModalOpen}
        setChatModalOpen={setChatModalOpen}
        bridge={bridge}
        chatOk={chatOk}
      />
      <HomeActionSheet
        activeSheet={activeSheet}
        themeMode={themeMode}
        language={language}
        languageOptions={languageOptions}
        themeButtonRef={themeButtonRef}
        languageButtonRef={languageButtonRef}
        t={t}
        setThemeMode={setThemeMode}
        setLanguage={setLanguage}
        setActiveSheet={setActiveSheet}
      />
    </div>
  );
}
