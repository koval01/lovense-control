'use client';

import type { RefObject } from 'react';
import type { TranslationKey } from '@/lib/i18n';
import type { LanguageCode, LanguageOption } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';
import type { Toy } from '@/lib/lovense-domain';
import { HomeMainView } from '@/components/home/HomeMainView';
import { HomeActionSheet } from '@/components/home/HomeActionSheet';
import type { LovenseStatus } from '@/store/slices/connectionSlice';

interface Props {
  status: LovenseStatus;
  qrUrl: string | null;
  qrCode: string | null;
  toys: Record<string, Toy>;
  error: string | null;
  sendCommand: (toyId: string, action: string, timeSec?: number) => void;
  activeToyIds: string[];
  activeToys: Record<string, Toy>;
  isHeaderVisible: boolean;
  t: (key: TranslationKey) => string;
  themeMode: ThemeMode;
  themeButtonRef: RefObject<HTMLButtonElement | null>;
  languageButtonRef: RefObject<HTMLButtonElement | null>;
  setActiveSheet: (s: 'theme' | 'language' | null) => void;
  setThemeMode: (m: ThemeMode) => void;
  setLanguage: (code: LanguageCode) => void;
  activeSheet: 'theme' | 'language' | null;
  language: LanguageCode;
  languageOptions: LanguageOption[];
  onToggleToy: (toyId: string) => void;
}

export function HomePageSelfSection(props: Props) {
  const {
    status,
    qrUrl,
    qrCode,
    toys,
    error,
    sendCommand,
    activeToyIds,
    activeToys,
    isHeaderVisible,
    t,
    themeMode,
    themeButtonRef,
    languageButtonRef,
    setActiveSheet,
    setThemeMode,
    setLanguage,
    activeSheet,
    language,
    languageOptions,
    onToggleToy,
  } = props;
  return (
    <>
      <HomeMainView
        statusData={{ status, qrUrl, qrCode, toys, error, sendCommand }}
        activeToyIds={activeToyIds}
        activeToys={activeToys}
        isHeaderVisible={isHeaderVisible}
        t={t}
        themeMode={themeMode}
        themeButtonRef={themeButtonRef}
        languageButtonRef={languageButtonRef}
        onOpenTheme={() => setActiveSheet('theme')}
        onOpenLanguage={() => setActiveSheet('language')}
        onToggleToy={onToggleToy}
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
    </>
  );
}
