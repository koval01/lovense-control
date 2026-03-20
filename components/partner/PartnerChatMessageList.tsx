'use client';

import { useEffect, type RefObject } from 'react';
import type { BridgeChatMessage } from '@/hooks/use-bridge-session';
import type { TranslationKey } from '@/lib/i18n';
import { PartnerChatVoiceMessageRow } from '@/components/partner/PartnerChatVoiceMessageRow';
import type { usePartnerChatVoicePlayback } from '@/components/partner/usePartnerChatVoicePlayback';

type Playback = ReturnType<typeof usePartnerChatVoicePlayback>;

export function PartnerChatMessageList(props: {
  chatMessages: BridgeChatMessage[];
  listRef: RefObject<HTMLDivElement | null>;
  partnerTyping: boolean;
  t: (key: TranslationKey) => string;
  playback: Playback;
}) {
  const { chatMessages, listRef, partnerTyping, t, playback } = props;
  const { playingId, setPlayingId, currentAudioRef, currentAudioIdRef, voiceWrapperRefs } = playback;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, listRef]);

  return (
    <>
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 px-4 pt-4 pb-2"
        role="log"
        aria-live="polite"
      >
        {chatMessages.length === 0 ? (
          <p className="text-sm text-[var(--app-text-secondary)]">{t('partnerChatEmpty')}</p>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.fromSelf ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words ${
                  msg.fromSelf
                    ? 'bg-[var(--app-accent)] text-white'
                    : 'bg-[var(--app-surface-soft)] text-[var(--app-text-primary)]'
                }`}
              >
                {msg.kind === 'audio' ? (
                  <PartnerChatVoiceMessageRow
                    msg={msg}
                    fromSelf={msg.fromSelf}
                    playingId={playingId}
                    setPlayingId={setPlayingId}
                    currentAudioRef={currentAudioRef}
                    currentAudioIdRef={currentAudioIdRef}
                    voiceWrapperRefs={voiceWrapperRefs}
                  />
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {partnerTyping && (
        <p className="px-4 pb-1 text-xs text-[var(--app-text-secondary)]">{t('partnerChatTyping')}</p>
      )}
    </>
  );
}
