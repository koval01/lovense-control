'use client';

import { useEffect, useRef, useState } from 'react';
import type { BridgeChatMessage } from '@/hooks/use-bridge-session';

export function usePartnerChatVoicePlayback(chatMessages: BridgeChatMessage[]) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioIdRef = useRef<string | null>(null);
  const voiceWrapperRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && currentAudioRef.current) {
        currentAudioRef.current.pause();
        setPlayingId(null);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

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
    return () => observer.disconnect();
  }, [chatMessages]);

  return {
    playingId,
    setPlayingId,
    currentAudioRef,
    currentAudioIdRef,
    voiceWrapperRefs,
  };
}
