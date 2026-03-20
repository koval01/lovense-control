'use client';

import { Panel, View } from '@vkontakte/vkui';
import type { Toy } from '@/lib/lovense-domain';
import type { TranslateOptions, TranslationKey } from '@/lib/i18n';
import type { ThemeMode } from '@/lib/theme';
import { HomeMainViewHeader } from './HomeMainViewHeader';
import { HomeMainViewBody } from './HomeMainViewBody';

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
  localToys?: Record<string, Toy>;
  localEnabledToyIds?: string[];
  isHeaderVisible: boolean;
  partnerEnabledToyIds?: string[];
  partnerLimits?: Record<string, number>;
  isPartnerMode?: boolean;
  emptyStateTitleKey?: TranslationKey;
  emptyStateHintKey?: TranslationKey;
  t: (key: TranslationKey, variables?: Record<string, string | number>, options?: TranslateOptions) => string;
  themeMode: ThemeMode;
  themeButtonRef: React.RefObject<HTMLButtonElement | null>;
  languageButtonRef: React.RefObject<HTMLButtonElement | null>;
  onOpenTheme: () => void;
  onOpenLanguage: () => void;
  onToggleToy: (toyId: string) => void;
  onToggleLocalToy?: (toyId: string) => void;
  isLocalToyPolicyToggleFrozen?: (toyId: string) => boolean;
  errorSecondaryAction?: { label: string; onClick: () => void };
  controlsFrozen?: boolean;
  headerLeftAction?: { label: string; onClick: () => void };
}

export function HomeMainView(props: HomeMainViewProps) {
  const { statusData, isHeaderVisible, themeMode, themeButtonRef, languageButtonRef, headerLeftAction, t, onOpenTheme, onOpenLanguage } = props;
  const { status, qrUrl, qrCode, toys, error, sendCommand } = statusData;

  return (
    <div id="main-content" className="h-full app-min-h-viewport bg-[var(--app-bg)] flex flex-col">
      <View activePanel="main" className="h-full">
        <Panel id="main" className="h-full">
          <HomeMainViewHeader
            isHeaderVisible={isHeaderVisible}
            themeMode={themeMode}
            themeButtonRef={themeButtonRef}
            languageButtonRef={languageButtonRef}
            headerLeftAction={headerLeftAction}
            t={t}
            onOpenTheme={onOpenTheme}
            onOpenLanguage={onOpenLanguage}
          />
          <HomeMainViewBody
            status={status}
            qrUrl={qrUrl}
            qrCode={qrCode}
            toys={toys}
            error={error}
            sendCommand={sendCommand}
            activeToyIds={props.activeToyIds}
            activeToys={props.activeToys}
            isPartnerMode={props.isPartnerMode}
            localToys={props.localToys}
            localEnabledToyIds={props.localEnabledToyIds}
            onToggleToy={props.onToggleToy}
            onToggleLocalToy={props.onToggleLocalToy}
            isLocalToyPolicyToggleFrozen={props.isLocalToyPolicyToggleFrozen}
            partnerEnabledToyIds={props.partnerEnabledToyIds}
            emptyStateTitleKey={props.emptyStateTitleKey}
            emptyStateHintKey={props.emptyStateHintKey}
            partnerLimits={props.partnerLimits}
            controlsFrozen={props.controlsFrozen ?? false}
            errorSecondaryAction={props.errorSecondaryAction}
          />
        </Panel>
      </View>
    </div>
  );
}
