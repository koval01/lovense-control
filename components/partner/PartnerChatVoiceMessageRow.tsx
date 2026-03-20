'use client';

import type { MutableRefObject } from 'react';
import type { BridgeChatMessage } from '@/hooks/use-bridge-session';

export function PartnerChatVoiceMessageRow(props: {
  msg: Extract<BridgeChatMessage, { kind: 'audio' }>;
  fromSelf: boolean;
  playingId: string | null;
  setPlayingId: (id: string | null) => void;
  currentAudioRef: MutableRefObject<HTMLAudioElement | null>;
  currentAudioIdRef: MutableRefObject<string | null>;
  voiceWrapperRefs: MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { msg, fromSelf, playingId, setPlayingId, currentAudioRef, currentAudioIdRef, voiceWrapperRefs } =
    props;
  return (
    <div
      ref={(el) => {
        if (!el) {
          voiceWrapperRefs.current.delete(msg.id);
          return;
        }
        voiceWrapperRefs.current.set(msg.id, el);
      }}
      className="flex items-center gap-3 max-w-[260px]"
    >
      <button
        type="button"
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          fromSelf ? 'bg-white text-[var(--app-accent)]' : 'bg-[var(--app-accent)] text-white'
        } shadow-sm`}
        onClick={() => {
          const audioEl =
            currentAudioRef.current && currentAudioIdRef.current === msg.id
              ? currentAudioRef.current
              : (document.getElementById(`voice-audio-${msg.id}`) as HTMLAudioElement | null);
          if (!audioEl) return;
          if (playingId === msg.id) {
            audioEl.pause();
            setPlayingId(null);
            return;
          }
          if (currentAudioRef.current && currentAudioRef.current !== audioEl) {
            currentAudioRef.current.pause();
          }
          currentAudioRef.current = audioEl;
          currentAudioIdRef.current = msg.id;
          void audioEl.play().catch(() => setPlayingId(null));
          setPlayingId(msg.id);
        }}
        style={{
          transform: playingId === msg.id ? 'scale(1.12)' : 'scale(1)',
          transition: 'transform 80ms linear',
        }}
      >
        <span className="text-base leading-none">{playingId === msg.id ? '❚❚' : '▶'}</span>
      </button>
      <div className="flex-1 h-2 rounded-full bg-white/30 overflow-hidden">
        <div className="h-full w-full bg-white/60" />
      </div>
      <span className="text-xs opacity-80 tabular-nums">
        {msg.durationMs != null ? `${Math.floor(msg.durationMs / 1000)}s` : ''}
      </span>
      <audio
        id={`voice-audio-${msg.id}`}
        src={msg.audioUrl}
        className="hidden"
        ref={(el) => {
          if (el && currentAudioIdRef.current === msg.id) currentAudioRef.current = el;
        }}
        onPlay={(e) => {
          const el = e.currentTarget;
          if (currentAudioRef.current && currentAudioRef.current !== el) currentAudioRef.current.pause();
          currentAudioRef.current = el;
          currentAudioIdRef.current = msg.id;
          setPlayingId(msg.id);
        }}
        onPause={(e) => {
          if (currentAudioRef.current === e.currentTarget) {
            currentAudioRef.current = null;
            currentAudioIdRef.current = null;
            if (playingId === msg.id) setPlayingId(null);
          }
        }}
        onEnded={(e) => {
          if (currentAudioRef.current === e.currentTarget) {
            currentAudioRef.current = null;
            currentAudioIdRef.current = null;
            if (playingId === msg.id) setPlayingId(null);
          }
        }}
      />
    </div>
  );
}
