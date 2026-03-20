'use client';

import { PanelHeader, PanelHeaderButton } from '@vkontakte/vkui';
import { Icon28ComputerOutline, Icon28GlobeOutline, Icon28MoonOutline, Icon28SunOutline } from '@vkontakte/icons';
import type { ThemeMode } from '@/lib/theme';
import type { TranslateOptions, TranslationKey } from '@/lib/i18n';

const HEADER_STYLE = {
  transition: 'opacity 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
};

type Props = {
  isHeaderVisible: boolean;
  themeMode: ThemeMode;
  themeButtonRef: React.RefObject<HTMLButtonElement | null>;
  languageButtonRef: React.RefObject<HTMLButtonElement | null>;
  headerLeftAction?: { label: string; onClick: () => void };
  t: (key: TranslationKey, variables?: Record<string, string | number>, options?: TranslateOptions) => string;
  onOpenTheme: () => void;
  onOpenLanguage: () => void;
};

export function HomeMainViewHeader({
  isHeaderVisible,
  themeMode,
  themeButtonRef,
  languageButtonRef,
  headerLeftAction,
  t,
  onOpenTheme,
  onOpenLanguage,
}: Props) {
  return (
    <PanelHeader
      transparent delimiter="none" className="bg-[var(--app-bg)]/90 backdrop-blur-md border-b border-[var(--app-border)]"
      style={{ ...HEADER_STYLE, opacity: isHeaderVisible ? 1 : 0, transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-10px)' }}
      before={
        headerLeftAction ? (
          <button
            type="button"
            onClick={headerLeftAction.onClick}
            className="text-[var(--vkui--color_panel_header_icon)] hover:opacity-80 active:opacity-70 text-[15px] font-medium py-1 pr-1 -ml-1 min-w-0"
          >
            {headerLeftAction.label}
          </button>
        ) : undefined
      }
      after={
        <div className="flex items-center app-header-actions">
          <PanelHeaderButton onClick={onOpenTheme} getRootRef={themeButtonRef} aria-label={t('theme')} title={t('theme')}>
            {themeMode === 'auto' ? <Icon28ComputerOutline /> : themeMode === 'light' ? <Icon28SunOutline /> : <Icon28MoonOutline />}
          </PanelHeaderButton>
          <PanelHeaderButton onClick={onOpenLanguage} getRootRef={languageButtonRef} aria-label={t('language')} title={t('language')}>
            <Icon28GlobeOutline />
          </PanelHeaderButton>
        </div>
      }
    >
      <span className="font-semibold tracking-tight">{t('appTitle')}</span>
    </PanelHeader>
  );
}
