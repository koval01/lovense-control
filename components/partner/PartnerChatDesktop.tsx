'use client';

import type { BridgeChatMessage } from '@/hooks/use-bridge-session';
import type { TranslationKey } from '@/lib/i18n';
import { PartnerChatContent } from './PartnerChatContent';

interface PartnerChatDesktopProps {
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
 * Desktop chat: fixed-width window (from 768px), does not stretch full width.
 */
export function PartnerChatDesktop(props: PartnerChatDesktopProps) {
  return (
    <div
      className="w-full max-w-[420px] flex flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-[var(--app-shadow)] overflow-hidden"
      style={{ minHeight: '280px' }}
    >
      <PartnerChatContent {...props} className="flex-1 min-h-0" />
    </div>
  );
}
