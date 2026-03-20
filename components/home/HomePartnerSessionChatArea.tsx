'use client';

import { CHAT_MAX_LENGTH } from '@/hooks/use-bridge-session';
import type { TranslationKey } from '@/lib/i18n';
import { PartnerChatFloating } from '@/components/partner/PartnerChatFloating';
import { PartnerChatModal } from '@/components/partner/PartnerChatModal';
import type { HomePartnerBridgeApi } from './home-partner-bridge-api';

interface Props {
  t: (key: TranslationKey) => string;
  isMobile: boolean;
  chatModalOpen: boolean;
  setChatModalOpen: (v: boolean) => void;
  bridge: HomePartnerBridgeApi;
  chatOk: boolean;
}

export function HomePartnerSessionChatArea({
  t,
  isMobile,
  chatModalOpen,
  setChatModalOpen,
  bridge,
  chatOk,
}: Props) {
  return (
    <>
      {isMobile ? (
        <div className="shrink-0 border-t border-[var(--app-border)] flex items-center justify-center px-2 py-2">
          <button
            type="button"
            onClick={() => setChatModalOpen(true)}
            className="rounded-[var(--app-radius-control)] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] py-2.5 px-4 text-sm text-[var(--app-text-primary)] flex items-center justify-center gap-2 hover:bg-[var(--app-surface-soft)] transition-colors touch-manipulation"
            aria-label={t('partnerChatTapToOpen')}
          >
            <span className="text-[var(--app-text-secondary)]">💬</span>
            {t('partnerChatTitle')}
          </button>
        </div>
      ) : (
        <PartnerChatFloating
          chatMessages={bridge.chatMessages}
          partnerTyping={bridge.partnerTyping}
          sendChatMessage={bridge.sendChatMessage}
          sendChatTyping={bridge.sendChatTyping}
          sendChatVoice={bridge.sendChatVoice}
          maxLength={CHAT_MAX_LENGTH}
          connectionOk={chatOk}
          t={t}
        />
      )}
      <PartnerChatModal
        open={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        chatMessages={bridge.chatMessages}
        partnerTyping={bridge.partnerTyping}
        sendChatMessage={bridge.sendChatMessage}
        sendChatTyping={bridge.sendChatTyping}
        sendChatVoice={bridge.sendChatVoice}
        maxLength={CHAT_MAX_LENGTH}
        connectionOk={chatOk}
        t={t}
      />
    </>
  );
}
