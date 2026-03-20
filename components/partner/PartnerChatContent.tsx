'use client';

import type { BridgeChatMessage } from '@/hooks/use-bridge-session';
import { CHAT_MAX_LENGTH } from '@/lib/bridge/chat';
import type { TranslationKey } from '@/lib/i18n';
import { PartnerChatComposer } from '@/components/partner/PartnerChatComposer';
import { PartnerChatMessageList } from '@/components/partner/PartnerChatMessageList';
import { usePartnerChatComposer } from '@/components/partner/usePartnerChatComposer';
import { usePartnerChatMediaRecorder } from '@/components/partner/usePartnerChatMediaRecorder';
import { usePartnerChatVoicePlayback } from '@/components/partner/usePartnerChatVoicePlayback';

export interface PartnerChatContentProps {
  chatMessages: BridgeChatMessage[];
  partnerTyping: boolean;
  sendChatMessage: (text: string) => void;
  sendChatTyping: (typing: boolean) => void;
  sendChatVoice: (blob: Blob, mime: string, durationMs?: number) => Promise<void> | void;
  maxLength?: number;
  connectionOk?: boolean;
  onInputBlur?: () => void;
  t: (key: TranslationKey) => string;
  className?: string;
}

export function PartnerChatContent({
  chatMessages,
  partnerTyping,
  sendChatMessage,
  sendChatTyping,
  sendChatVoice,
  maxLength = CHAT_MAX_LENGTH,
  connectionOk = true,
  onInputBlur,
  t,
  className = '',
}: PartnerChatContentProps) {
  const composer = usePartnerChatComposer({
    sendChatMessage,
    sendChatTyping,
    maxLength,
    t,
  });
  const { isRecording, handleStartRecording, handleStopRecording } =
    usePartnerChatMediaRecorder(sendChatVoice);
  const playback = usePartnerChatVoicePlayback(chatMessages);
  return (
    <div className={`flex flex-col min-h-0 flex-1 ${className}`}>
      <PartnerChatMessageList
        chatMessages={chatMessages}
        listRef={composer.listRef}
        partnerTyping={partnerTyping}
        t={t}
        playback={playback}
      />
      <PartnerChatComposer
        connectionOk={connectionOk}
        maxLength={maxLength}
        onInputBlur={onInputBlur}
        t={t}
        composer={composer}
        isRecording={isRecording}
        onVoiceStart={handleStartRecording}
        onVoiceStop={handleStopRecording}
      />
    </div>
  );
}
