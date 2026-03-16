'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon28Send, Icon28VoiceOutline } from '@vkontakte/icons';
import { WriteBar, WriteBarIcon } from '@vkontakte/vkui';
import type { BridgeChatMessage } from '@/hooks/use-bridge-session';
import {
  CHAT_FLOOD_INTERVAL_MS,
  CHAT_MAX_LENGTH,
  validateChatText,
} from '@/lib/bridge/chat';
import type { TranslationKey } from '@/lib/i18n';

const VOICE_MAX_DURATION_MS = 59_000;

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
  /** Optional class for the root (e.g. for desktop window inner padding). */
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
  const [input, setInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastSendAt, setLastSendAt] = useState(0);
  const [cooldownProgress, setCooldownProgress] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioIdRef = useRef<string | null>(null);
  // Wrapper elements for voice messages (for IntersectionObserver)
  const voiceWrapperRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  // Cooldown ring: fill from 0 to 1 over CHAT_FLOOD_INTERVAL_MS after send
  useEffect(() => {
    if (lastSendAt === 0) return;
    const start = lastSendAt;
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / CHAT_FLOOD_INTERVAL_MS);
      setCooldownProgress(progress);
      if (progress >= 1) clearInterval(intervalId);
    }, 50);
    return () => clearInterval(intervalId);
  }, [lastSendAt]);

  const stopTyping = useCallback(() => {
    sendChatTyping(false);
    if (typingStopRef.current) {
      clearTimeout(typingStopRef.current);
      typingStopRef.current = null;
    }
  }, [sendChatTyping]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length > maxLength) return;
      setInput(value);
      setValidationError(null);
      if (value.trim()) {
        sendChatTyping(true);
        if (typingStopRef.current) clearTimeout(typingStopRef.current);
        typingStopRef.current = setTimeout(stopTyping, 2000);
      } else {
        stopTyping();
      }
    },
    [maxLength, sendChatTyping, stopTyping]
  );

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (cooldownProgress < 1) return;
    const { ok, error: err } = validateChatText(trimmed);
    if (!ok) {
      setValidationError(err ?? t('partnerChatInvalid'));
      return;
    }
    setValidationError(null);
    sendChatMessage(trimmed);
    setInput('');
    stopTyping();
    setLastSendAt(Date.now());
    setCooldownProgress(0);
  }, [input, sendChatMessage, stopTyping, t, cooldownProgress]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleStartRecording = useCallback(async () => {
    if (isRecording) return;
    if (typeof window === 'undefined') return;
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = async () => {
        setIsRecording(false);
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        const chunks = recordingChunksRef.current;
        recordingChunksRef.current = [];
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mime });
        const startedAt = recordingStartRef.current;
        recordingStartRef.current = null;
        const durationMs = startedAt != null ? Date.now() - startedAt : undefined;
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
        if (blob.size > 0) {
          await sendChatVoice(blob, mime, durationMs);
        }
      };
      recordingStartRef.current = Date.now();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recorder.start();
      // Safety guard: stop automatically after VOICE_MAX_DURATION_MS
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, VOICE_MAX_DURATION_MS + 500);
    } catch {
      // User denied mic or unsupported; ignore.
    }
  }, [isRecording, sendChatVoice]);

  const handleStopRecording = useCallback(() => {
    if (!isRecording) return;
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === 'recording') {
      recorder.stop();
    }
  }, [isRecording]);

  // Pause currently playing voice message when tab becomes hidden.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && currentAudioRef.current) {
        currentAudioRef.current.pause();
        setPlayingId(null);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Pause currently playing voice message when it scrolls out of view.
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            for (const [id, el] of voiceWrapperRefs.current.entries()) {
              if (el === entry.target && id === currentAudioIdRef.current && currentAudioRef.current) {
                currentAudioRef.current.pause();
                setPlayingId(null);
              }
            }
          }
        }
      },
      { threshold: 0 }
    );
    voiceWrapperRefs.current.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
    };
  }, [chatMessages]);

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${className}`}>
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
                {'kind' in msg && msg.kind === 'audio' ? (
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
                        msg.fromSelf ? 'bg-white text-[var(--app-accent)]' : 'bg-[var(--app-accent)] text-white'
                      } shadow-sm`}
                      onClick={() => {
                        const audioEl = currentAudioRef.current && currentAudioIdRef.current === msg.id
                          ? currentAudioRef.current
                          : (() => {
                              const el = document.getElementById(`voice-audio-${msg.id}`) as HTMLAudioElement | null;
                              return el || null;
                            })();
                        if (!audioEl) return;
                        const isCurrentlyPlaying = playingId === msg.id;
                        if (isCurrentlyPlaying) {
                          audioEl.pause();
                          setPlayingId(null);
                          return;
                        }
                        if (currentAudioRef.current && currentAudioRef.current !== audioEl) {
                          currentAudioRef.current.pause();
                        }
                        currentAudioRef.current = audioEl;
                        currentAudioIdRef.current = msg.id;
                        void audioEl.play().catch(() => {
                          setPlayingId(null);
                        });
                        setPlayingId(msg.id);
                      }}
                      style={{
                        transform: playingId === msg.id ? 'scale(1.12)' : 'scale(1)',
                        transition: 'transform 80ms linear',
                      }}
                    >
                      <span className="text-base leading-none">
                        {playingId === msg.id ? '❚❚' : '▶'}
                      </span>
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
                        if (el && currentAudioIdRef.current === msg.id) {
                          currentAudioRef.current = el;
                        }
                      }}
                      onPlay={(e) => {
                        const el = e.currentTarget;
                        if (currentAudioRef.current && currentAudioRef.current !== el) {
                          currentAudioRef.current.pause();
                        }
                        currentAudioRef.current = el;
                        currentAudioIdRef.current = msg.id;
                        setPlayingId(msg.id);
                      }}
                      onPause={(e) => {
                        if (currentAudioRef.current === e.currentTarget) {
                          currentAudioRef.current = null;
                          currentAudioIdRef.current = null;
                          if (playingId === msg.id) {
                            setPlayingId(null);
                          }
                        }
                      }}
                      onEnded={(e) => {
                        if (currentAudioRef.current === e.currentTarget) {
                          currentAudioRef.current = null;
                          currentAudioIdRef.current = null;
                          if (playingId === msg.id) {
                            setPlayingId(null);
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {partnerTyping && (
        <p className="px-4 pb-1 text-xs text-[var(--app-text-secondary)]">
          {t('partnerChatTyping')}
        </p>
      )}
      <div className="shrink-0 px-4 pb-4 pt-2 flex flex-col gap-2 backdrop-blur-md shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.25)]">
        {!connectionOk ? (
          <p className="text-sm text-[var(--app-text-secondary)]" role="status">
            {t('partnerChatUnavailable')}
          </p>
        ) : (
          <>
            <WriteBar
              className='rounded-2xl'
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={onInputBlur}
              placeholder={t('partnerChatPlaceholder')}
              maxLength={maxLength}
              rows={1}
              shadow
              slotProps={{
                textArea: {
                  className: '!rounded-2xl',
                },
              }}
              before={
                <WriteBarIcon
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  label={isRecording ? t('partnerChatVoiceStop') : t('partnerChatVoiceStart')}
                  className={isRecording ? '!bg-red-500 !text-white' : ''}
                >
                  <Icon28VoiceOutline />
                </WriteBarIcon>
              }
              after={
                <WriteBarIcon
                  mode="send"
                  onClick={handleSubmit}
                  disabled={!input.trim() || cooldownProgress < 1}
                  label={t('partnerChatSend')}
                  aria-busy={cooldownProgress < 1}
                />
              }
            />
            <div className="flex justify-between items-center min-h-[20px]">
              <span className="text-xs text-[var(--app-text-secondary)]">
                {input.length} / {maxLength}
              </span>
              {validationError && (
                <span className="text-xs text-red-500" role="alert">
                  {validationError}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
