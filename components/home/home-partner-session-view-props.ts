import type { RefObject } from 'react';
import type { TranslationKey } from '@/lib/i18n';
import type { LanguageCode, LanguageOption } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';
import type { Toy } from '@/lib/lovense-domain';
import type { HomePartnerBridgeApi } from '@/components/home/home-partner-bridge-api';

export interface HomePartnerSessionViewProps {
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
  bridge: HomePartnerBridgeApi;
  partnerStatus: 'error' | 'connecting' | 'online';
  partnerError: string | null;
  partnerToys: Record<string, Toy>;
  partnerActiveToys: Record<string, Toy>;
  partnerActiveToyIds: string[];
  partnerControlsFrozen: boolean;
  showPartnerDroppedBanner: boolean;
  onCopyPairCode: () => Promise<void>;
  onPartnerExit: () => void;
}
