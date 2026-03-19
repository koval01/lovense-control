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
  qrCode: string | null;
  toys: Record<string, Toy>;
  error: string | null;
  sendCommand: (toyId: string, action: string, timeSec?: number) => void;
};

interface HomeMainViewProps {
  statusData: HomeStatusData;
  activeToyIds: string[];
  activeToys: Record<string, Toy>;
  /** Partner mode: local toys and allow-list for partner control. */
  localToys?: Record<string, Toy>;
  localEnabledToyIds?: string[];
  isHeaderVisible: boolean;
  /** Partner mode: toys enabled by partner for us; show disabled state for the rest. */
  partnerEnabledToyIds?: string[];
  /** Partner mode: partner's limits (read-only in Max Level). */
  partnerLimits?: Record<string, number>;
  isPartnerMode?: boolean;
  /** Override empty state when toys list is empty (e.g. partner mode: waiting for partner). */
  emptyStateTitleKey?: TranslationKey;
  emptyStateHintKey?: TranslationKey;
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
  onToggleLocalToy?: (toyId: string) => void;
  isLocalToyPolicyToggleFrozen?: (toyId: string) => boolean;
  /** When status is error, optional secondary button (e.g. Exit partner mode). */
  errorSecondaryAction?: { label: string; onClick: () => void };
  /** Partner / reconnect: block sliders and commands (visual freeze). */
  controlsFrozen?: boolean;
  /** Optional left header action (e.g. "Exit to main menu") — рендерится в одной строке с заголовком. */
  headerLeftAction?: { label: string; onClick: () => void };
}

const HEADER_STYLE = {
  transition: 'opacity 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
};

export function HomeMainView({
  statusData,
  activeToyIds,
  activeToys,
  localToys,
  localEnabledToyIds,
  isHeaderVisible,
  partnerEnabledToyIds,
  partnerLimits,
  isPartnerMode,
  emptyStateTitleKey,
  emptyStateHintKey,
  t,
  themeMode,
  themeButtonRef,
  languageButtonRef,
  onOpenTheme,
  onOpenLanguage,
  onToggleToy,
  onToggleLocalToy,
  isLocalToyPolicyToggleFrozen,
  errorSecondaryAction,
  controlsFrozen = false,
  headerLeftAction,
}: HomeMainViewProps) {
  const { status, qrUrl, qrCode, toys, error, sendCommand } = statusData;

  return (
    <div id="main-content" className="h-full app-min-h-viewport bg-[var(--app-bg)] flex flex-col">
      <View activePanel="main" className="h-full">
        <Panel id="main" className="h-full">
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
          <div className={`flex-1 min-h-0 flex flex-col ${status === 'online' ? 'items-stretch md:items-center justify-start pb-0' : 'items-center justify-center pb-10'}`}>
            <AnimatePresence mode="wait">
              {status === 'idle' || status === 'initializing' || status === 'connecting' ? <StatusLoadingView /> : null}
              {status === 'error' ? <StatusErrorView error={error} secondaryAction={errorSecondaryAction} /> : null}
              {status === 'qr_ready' ? <StatusQrView qrUrl={qrUrl} qrCode={qrCode} /> : null}
              {status === 'online' ? (
                <StatusOnlineView
                  toys={toys}
                  activeToyIds={activeToyIds}
                  onToggleToy={onToggleToy}
                  localToys={isPartnerMode ? localToys : undefined}
                  localEnabledToyIds={isPartnerMode ? localEnabledToyIds : undefined}
                  onToggleLocalToy={isPartnerMode ? onToggleLocalToy : undefined}
                  isLocalToyPolicyToggleFrozen={isPartnerMode ? isLocalToyPolicyToggleFrozen : undefined}
                  partnerEnabledToyIds={isPartnerMode ? partnerEnabledToyIds : undefined}
                  emptyStateTitleKey={emptyStateTitleKey}
                  emptyStateHintKey={emptyStateHintKey}
                >
                  <ToyControlContainer
                    toys={activeToys}
                    onCommand={sendCommand}
                    activeToyIds={activeToyIds}
                    editableLimitToys={isPartnerMode ? localToys : undefined}
                    partnerLimits={isPartnerMode ? partnerLimits : undefined}
                    interactive={!controlsFrozen}
                  />
                </StatusOnlineView>
              ) : null}
            </AnimatePresence>
          </div>
        </Panel>
      </View>
    </div>
  );
}
