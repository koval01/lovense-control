'use client';

import { useEffect } from 'react';
import type { BridgeChatMessage } from '@/hooks/use-bridge-session';
import type { TranslationKey } from '@/lib/i18n';
import { PartnerChatContent } from './PartnerChatContent';

export interface PartnerChatModalProps {
  open: boolean;
  onClose: () => void;
  chatMessages: BridgeChatMessage[];
  partnerTyping: boolean;
  sendChatMessage: (text: string) => void;
  sendChatTyping: (typing: boolean) => void;
  sendChatVoice: (blob: Blob, mime: string, durationMs?: number) => Promise<void> | void;
  maxLength?: number;
  connectionOk?: boolean;
  t: (key: TranslationKey) => string;
}

/**
 * Chat as a modal overlay: backdrop + centered panel with header and close button.
 */
export function PartnerChatModal({
  open,
  onClose,
  chatMessages,
  partnerTyping,
  sendChatMessage,
  sendChatTyping,
  sendChatVoice,
  maxLength,
  connectionOk,
  t,
}: PartnerChatModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-chat-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        tabIndex={0}
        role="button"
        aria-label={t('partnerChatClose')}
      />
      <div
        className="relative w-full max-w-[420px] max-h-[85vh] flex flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-[var(--app-shadow)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3">
          <h2 id="partner-chat-modal-title" className="text-base font-semibold text-[var(--app-text-primary)]">
            {t('partnerChatTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-soft)] active:opacity-80 touch-manipulation"
            aria-label={t('partnerChatClose')}
          >
            <span className="text-xl leading-none" aria-hidden>×</span>
          </button>
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
    </div>
  );
}
