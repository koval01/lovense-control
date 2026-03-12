'use client';

import { AnimatePresence } from 'motion/react';
import { Panel, PanelHeader, PanelHeaderButton, View } from '@vkontakte/vkui';
import { Icon28ComputerOutline, Icon28GlobeOutline, Icon28MoonOutline, Icon28SunOutline } from '@vkontakte/icons';
import { StatusErrorView, StatusLoadingView, StatusOnlineView, StatusQrView } from '@/components/status/StatusViews';
import { ToyControlContainer } from '@/components/ToyControlContainer';
import type { ThemeMode } from '@/lib/theme';
import type { Toy } from '@/lib/lovense-domain';
import type { TranslateOptions, TranslationKey } from '@/lib/i18n';

type HomeStatusData = {
  status: 'idle' | 'initializing' | 'connecting' | 'qr_ready' | 'online' | 'error';
  qrUrl: string | null;
  toys: Record<string, Toy>;
  error: string | null;
  sendCommand: (toyId: string, action: string, timeSec?: number) => void;
};

interface HomeMainViewProps {
  statusData: HomeStatusData;
  activeToyIds: string[];
  activeToys: Record<string, Toy>;
  isHeaderVisible: boolean;
  t: (
    key: TranslationKey,
    variables?: Record<string, string | number>,
    options?: TranslateOptions
  ) => string;
  themeMode: ThemeMode;
  themeButtonRef: React.RefObject<HTMLButtonElement | null>;
  languageButtonRef: React.RefObject<HTMLButtonElement | null>;
  onOpenTheme: () => void;
  onOpenLanguage: () => void;
  onToggleToy: (toyId: string) => void;
}

const HEADER_STYLE = {
  transition: 'opacity 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
};

export function HomeMainView({
  statusData,
  activeToyIds,
  activeToys,
  isHeaderVisible,
  t,
  themeMode,
  themeButtonRef,
  languageButtonRef,
  onOpenTheme,
  onOpenLanguage,
  onToggleToy,
}: HomeMainViewProps) {
  const { status, qrUrl, toys, error, sendCommand } = statusData;

  return (
    <div id="main-content" className="h-full app-min-h-viewport bg-[var(--app-bg)] flex flex-col">
      <View activePanel="main" className="h-full">
        <Panel id="main" className="h-full">
          <PanelHeader
            transparent delimiter="none" className="bg-[var(--app-bg)]/90 backdrop-blur-md border-b border-[var(--app-border)]"
            style={{ ...HEADER_STYLE, opacity: isHeaderVisible ? 1 : 0, transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-10px)' }}
            after={
              <div className="flex items-center">
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
          <div className={`flex-1 min-h-0 flex flex-col ${status === 'online' ? 'items-stretch md:items-center justify-start pb-0' : 'items-center justify-center pb-10'}`}>
            <AnimatePresence mode="wait">
              {status === 'idle' || status === 'initializing' || status === 'connecting' ? <StatusLoadingView /> : null}
              {status === 'error' ? <StatusErrorView error={error} /> : null}
              {status === 'qr_ready' ? <StatusQrView qrUrl={qrUrl} /> : null}
              {status === 'online' ? (
                <StatusOnlineView toys={toys} activeToyIds={activeToyIds} onToggleToy={onToggleToy}>
                  <ToyControlContainer toys={activeToys} onCommand={sendCommand} activeToyIds={activeToyIds} />
                </StatusOnlineView>
              ) : null}
            </AnimatePresence>
          </div>
        </Panel>
      </View>
    </div>
  );
}
