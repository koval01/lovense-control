'use client';

import type { ReactNode } from 'react';
import type { RefObject } from 'react';
import type { TranslationKey } from '@/lib/i18n';
import type { LanguageCode, LanguageOption } from '@/lib/i18n/types';
import type { ThemeMode } from '@/lib/theme';
import type { Toy } from '@/lib/lovense-domain';
import type { LovenseStatus } from '@/store/slices/connectionSlice';
import { HomePageSelfSection } from '@/components/home/HomePageSelfSection';

export function homePageSelfMainNode(p: {
  lovenseStatus: LovenseStatus;
  qrUrl: string | null;
  qrCode: string | null;
  toys: Record<string, Toy>;
  lovenseError: string | null;
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
}): ReactNode {
  return (
    <HomePageSelfSection
      status={p.lovenseStatus}
      qrUrl={p.qrUrl}
      qrCode={p.qrCode}
      toys={p.toys}
      error={p.lovenseError}
      sendCommand={p.sendCommand}
      activeToyIds={p.activeToyIds}
      activeToys={p.activeToys}
      isHeaderVisible={p.isHeaderVisible}
      t={p.t}
      themeMode={p.themeMode}
      themeButtonRef={p.themeButtonRef}
      languageButtonRef={p.languageButtonRef}
      setActiveSheet={p.setActiveSheet}
      setThemeMode={p.setThemeMode}
      setLanguage={p.setLanguage}
      activeSheet={p.activeSheet}
      language={p.language}
      languageOptions={p.languageOptions}
      onToggleToy={p.onToggleToy}
    />
  );
}
