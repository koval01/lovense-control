import type { ReactNode, RefObject } from 'react';
import type { TranslationKey } from '@/lib/i18n';
import type { LanguageCode, LanguageOption } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';
import type { Toy } from '@/lib/lovense-domain';
import { homePageBootTree } from '@/components/home/HomePageBootTree';
import { homePageMainRoutes } from '@/components/home/HomePageMainRoutes';
import type { ConnectionMode } from '@/store/slices/connectionSlice';

type OnboardingArg = Parameters<typeof homePageBootTree>[2];
type BridgeRet = ReturnType<typeof import('@/hooks/use-bridge-session').useBridgeSession>;
type LovenseRet = ReturnType<typeof import('@/hooks/use-lovense').useLovense>;

export function resolveHomePageView(args: {
  shouldShowSplash: boolean;
  isReady: boolean;
  onboarding: OnboardingArg;
  language: LanguageCode;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  mode: ConnectionMode;
  bridge: BridgeRet;
  lovense: LovenseRet;
  pairCodeInput: string;
  setPairCodeInput: (v: string) => void;
  t: (key: TranslationKey) => string;
  languageOptions: LanguageOption[];
  themeButtonRef: RefObject<HTMLButtonElement | null>;
  languageButtonRef: RefObject<HTMLButtonElement | null>;
  setActiveSheet: (s: 'theme' | 'language' | null) => void;
  setLanguage: (code: LanguageCode) => void;
  activeSheet: 'theme' | 'language' | null;
  isHeaderVisible: boolean;
  isMobile: boolean;
  chatModalOpen: boolean;
  setChatModalOpen: (v: boolean) => void;
  activeToyIds: string[];
  activeToys: Record<string, Toy>;
  handleToggleToy: (toyId: string) => void;
  setModeAndHash: (m: ConnectionMode) => void;
}): { key: string; node: ReactNode } {
  const boot = homePageBootTree(
    args.shouldShowSplash,
    args.isReady,
    args.onboarding,
    args.language,
    args.themeMode,
    args.setThemeMode
  );
  return (
    boot ??
    homePageMainRoutes({
      mode: args.mode,
      isBridgeAvailable: args.bridge.isBridgeAvailable,
      setModeAndHash: args.setModeAndHash,
      bridge: args.bridge,
      pairCodeInput: args.pairCodeInput,
      setPairCodeInput: args.setPairCodeInput,
      t: args.t,
      themeMode: args.themeMode,
      language: args.language,
      languageOptions: args.languageOptions,
      themeButtonRef: args.themeButtonRef,
      languageButtonRef: args.languageButtonRef,
      setActiveSheet: args.setActiveSheet,
      setThemeMode: args.setThemeMode,
      setLanguage: args.setLanguage,
      activeSheet: args.activeSheet,
      isHeaderVisible: args.isHeaderVisible,
      isMobile: args.isMobile,
      chatModalOpen: args.chatModalOpen,
      setChatModalOpen: args.setChatModalOpen,
      lovenseStatus: args.lovense.status,
      qrUrl: args.lovense.qrUrl,
      qrCode: args.lovense.qrCode,
      toys: args.lovense.toys,
      lovenseError: args.lovense.error,
      sendCommand: args.lovense.sendCommand,
      activeToyIds: args.activeToyIds,
      activeToys: args.activeToys,
      onToggleToy: args.handleToggleToy,
    })
  );
}
