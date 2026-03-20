'use client';

import type { BridgeChatMessage } from '@/hooks/use-bridge-session';
import type { TranslationKey } from '@/lib/i18n';
import { PartnerChatContent } from './PartnerChatContent';
import { HEIGHT, MAX_HEIGHT, MIN_HEIGHT, WIDTH } from './partner-chat-floating-constants';
import { usePartnerChatFloatingDrag } from './usePartnerChatFloatingDrag';

export interface PartnerChatFloatingProps {
  chatMessages: BridgeChatMessage[];
  partnerTyping: boolean;
  sendChatMessage: (text: string) => void;
  sendChatTyping: (typing: boolean) => void;
  sendChatVoice: (blob: Blob, mime: string, durationMs?: number) => Promise<void> | void;
  maxLength?: number;
  connectionOk?: boolean;
  t: (key: TranslationKey) => string;
}

/** Desktop-only: always-visible chat as a draggable floating window. */
export function PartnerChatFloating({
  chatMessages,
  partnerTyping,
  sendChatMessage,
  sendChatTyping,
  sendChatVoice,
  maxLength,
  connectionOk,
  t,
}: PartnerChatFloatingProps) {
  const { pos, handlePointerDown } = usePartnerChatFloatingDrag();

  return (
    <div
      className="fixed z-50 flex flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-[var(--app-shadow)] overflow-hidden select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: WIDTH,
        height: HEIGHT,
        minHeight: MIN_HEIGHT,
        maxHeight: Math.min(MAX_HEIGHT, typeof window !== 'undefined' ? window.innerHeight - pos.y - 16 : MAX_HEIGHT),
      }}
      role="complementary"
      aria-label={t('partnerChatTitle')}
    >
      <div
        className="shrink-0 flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-2 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
      >
        <span className="text-sm font-semibold text-[var(--app-text-primary)] flex items-center gap-1.5">
          <span className="text-[var(--app-text-secondary)]">💬</span>
          {t('partnerChatTitle')}
        </span>
      </div>
      <PartnerChatContent
        chatMessages={chatMessages}
        partnerTyping={partnerTyping}
        sendChatMessage={sendChatMessage}
        sendChatTyping={sendChatTyping}
        sendChatVoice={sendChatVoice}
        maxLength={maxLength}
        connectionOk={connectionOk}
        t={t}
        className="flex-1 min-h-0"
      />
    </div>
  );
}
