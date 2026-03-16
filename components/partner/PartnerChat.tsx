'use client';

import type { BridgeChatMessage } from '@/hooks/use-bridge-session';
import type { TranslationKey } from '@/lib/i18n';
import { PartnerChatContent } from './PartnerChatContent';

interface PartnerChatProps {
  chatMessages: BridgeChatMessage[];
  partnerTyping: boolean;
  sendChatMessage: (text: string) => void;
  sendChatTyping: (typing: boolean) => void;
  sendChatVoice: (blob: Blob, mime: string, durationMs?: number) => Promise<void> | void;
  maxLength?: number;
  connectionOk?: boolean;
  onInputBlur?: () => void;
  t: (key: TranslationKey) => string;
}

/**
 * Mobile chat: full-width bar at the bottom, same content as desktop.
 */
export function PartnerChat(props: PartnerChatProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--app-bg-elevated)] pt-2">
      <PartnerChatContent {...props} />
    </div>
  );
}
