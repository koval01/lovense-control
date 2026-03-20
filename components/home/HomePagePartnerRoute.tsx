'use client';

import type { RefObject } from 'react';
import type { TranslationKey } from '@/lib/i18n';
import type { LanguageCode, LanguageOption } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';
import type { ConnectionMode } from '@/store/slices/connectionSlice';
import { HomePartnerSetupScreen } from '@/components/home/HomePartnerSetupScreen';
import { HomePagePartnerInRoom } from '@/components/home/HomePagePartnerInRoom';

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
  pairCodeInput: string;
  setPairCodeInput: (v: string) => void;
  setModeAndHash: (mode: ConnectionMode) => void;
}

export function HomePagePartnerRoute(p: Props) {
  if (!p.bridge.roomId) {
    return (
      <HomePartnerSetupScreen
        t={p.t}
        bridge={p.bridge}
        pairCodeInput={p.pairCodeInput}
        setPairCodeInput={p.setPairCodeInput}
        setModeAndHash={p.setModeAndHash}
      />
    );
  }
  return <HomePagePartnerInRoom {...p} />;
}
