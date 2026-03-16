'use client';

import { ActionSheet, ActionSheetDefaultIosCloseItem, ActionSheetItem } from '@vkontakte/vkui';
import type { LanguageCode, LanguageOption } from '@/lib/i18n';
import type { ThemeMode } from '@/lib/theme';
import type { TranslationKey, TranslateOptions } from '@/lib/i18n';

interface HomeActionSheetProps {
  activeSheet: 'theme' | 'language' | null;
  themeMode: ThemeMode;
  language: LanguageCode;
  languageOptions: LanguageOption[];
  themeButtonRef: React.RefObject<HTMLButtonElement | null>;
  languageButtonRef: React.RefObject<HTMLButtonElement | null>;
  t: (
    key: TranslationKey,
    variables?: Record<string, string | number>,
    options?: TranslateOptions
  ) => string;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (code: LanguageCode) => void;
  setActiveSheet: (sheet: 'theme' | 'language' | null) => void;
}

export function HomeActionSheet({
  activeSheet,
  themeMode,
  language,
  languageOptions,
  themeButtonRef,
  languageButtonRef,
  t,
  setThemeMode,
  setLanguage,
  setActiveSheet,
}: HomeActionSheetProps) {
  if (activeSheet === 'theme') {
    return (
      <ActionSheet onClose={() => setActiveSheet(null)} toggleRef={themeButtonRef} iosCloseItem={<ActionSheetDefaultIosCloseItem />}>
        {(['auto', 'light', 'dark'] as const).map((mode) => (
          <ActionSheetItem key={mode} onClick={() => { setThemeMode(mode); setActiveSheet(null); }}>
            {themeMode === mode ? '✓ ' : ''}{t(mode === 'auto' ? 'themeAuto' : mode === 'light' ? 'themeLight' : 'themeDark')}
          </ActionSheetItem>
        ))}
      </ActionSheet>
    );
  }

  if (activeSheet !== 'language') return null;

  return (
    <ActionSheet onClose={() => setActiveSheet(null)} toggleRef={languageButtonRef} iosCloseItem={<ActionSheetDefaultIosCloseItem />}>
      {languageOptions.map((option) => (
        <ActionSheetItem key={option.code} onClick={() => { setLanguage(option.code); setActiveSheet(null); }}>
          {language === option.code ? '✓ ' : ''}{option.nativeName}
        </ActionSheetItem>
      ))}
    </ActionSheet>
  );
}
