'use client';

import type { ReactNode, RefObject } from 'react';
import type { TranslationKey } from '@/lib/i18n';
import type { LanguageCode, LanguageOption } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';
import type { Toy } from '@/lib/lovense-domain';
import type { ConnectionMode, LovenseStatus } from '@/store/slices/connectionSlice';
import { HomeModeSelectPanel } from '@/components/home/HomeModeSelectPanel';
import { HomePagePartnerRoute } from '@/components/home/HomePagePartnerRoute';
import { homePageSelfMainNode } from '@/components/home/homePageSelfMainNode';

type BridgeSessionReturn = ReturnType<typeof import('@/hooks/use-bridge-session').useBridgeSession>;

interface Props {
  mode: ConnectionMode;
  isBridgeAvailable: boolean;
  setModeAndHash: (m: ConnectionMode) => void;
  bridge: BridgeSessionReturn;
  pairCodeInput: string;
  setPairCodeInput: (v: string) => void;
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
  lovenseStatus: LovenseStatus;
  qrUrl: string | null;
  qrCode: string | null;
  toys: Record<string, Toy>;
  lovenseError: string | null;
  sendCommand: (toyId: string, action: string, timeSec?: number) => void;
  activeToyIds: string[];
  activeToys: Record<string, Toy>;
  onToggleToy: (toyId: string) => void;
}

export function homePageMainRoutes(p: Props): { key: string; node: ReactNode } {
  if (p.mode === 'unselected') {
    return {
      key: 'mode-select',
      node: <HomeModeSelectPanel t={p.t} isBridgeAvailable={p.isBridgeAvailable} setModeAndHash={p.setModeAndHash} />,
    };
  }
  if (p.mode === 'partner') {
    return {
      key: p.bridge.roomId ? 'partner-main' : 'partner-setup',
      node: (
        <HomePagePartnerRoute
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
          pairCodeInput={p.pairCodeInput}
          setPairCodeInput={p.setPairCodeInput}
          setModeAndHash={p.setModeAndHash}
        />
      ),
    };
  }
  return { key: 'self-main', node: homePageSelfMainNode(p) };
}
